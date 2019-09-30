package transport

import (
	"crypto/tls"
	"crypto/x509"
	"encoding/json"

	//	flow "github.com/cloudflare/flow-pipeline/pb-ext"
	"net"
	"os"

	sarama "github.com/Shopify/sarama"
	log "github.com/Sirupsen/logrus"
	flowmessage "github.com/cloudflare/goflow/pb"
	proto "github.com/golang/protobuf/proto"
)

type KafkaState struct {
	producer sarama.AsyncProducer
	topic    string
}

func StartKafkaProducer(addrs []string, topic string, use_tls bool, use_sasl bool) *KafkaState {
	kafkaConfig := sarama.NewConfig()
	kafkaConfig.Producer.Return.Successes = false
	kafkaConfig.Producer.Return.Errors = false
	if use_tls {
		rootCAs, err := x509.SystemCertPool()
		if err != nil {
			log.Fatalf("Error initializing TLS: %v", err)
		}
		kafkaConfig.Net.TLS.Enable = true
		kafkaConfig.Net.TLS.Config = &tls.Config{RootCAs: rootCAs}
	}
	if use_sasl {
		if !use_tls {
			log.Warnln("Using SASL without TLS will transmit the authentication in plaintext!")
		}
		kafkaConfig.Net.SASL.Enable = true
		kafkaConfig.Net.SASL.User = os.Getenv("KAFKA_SASL_USER")
		kafkaConfig.Net.SASL.Password = os.Getenv("KAFKA_SASL_PASS")
		if kafkaConfig.Net.SASL.User == "" && kafkaConfig.Net.SASL.Password == "" {
			log.Fatalf("Kafka SASL config from environment was unsuccessful. KAFKA_SASL_USER and KAFKA_SASL_PASS need to be set.")
		} else {
			log.Infof("Authenticating as user '%s'...", kafkaConfig.Net.SASL.User)
		}
	}

	kafkaProducer, err := sarama.NewAsyncProducer(addrs, kafkaConfig)
	if err != nil {
		log.Fatalf("%v", err)
	}
	state := KafkaState{
		producer: kafkaProducer,
		topic:    topic,
	}

	return &state
}

func (kafkaState KafkaState) SendKafkaFlowMessage(flowMessage *flowmessage.FlowMessage) {
	rawfmsg, _ := proto.Marshal(flowMessage)
	var fmsg flowmessage.FlowMessage

	err := proto.Unmarshal(rawfmsg, &fmsg)
	if err != nil {
		log.Printf("unmarshaling error: ", err)
	} else {
		srcip := net.IP(fmsg.SrcIP)
		dstip := net.IP(fmsg.DstIP)
		routeradd := net.IP(fmsg.RouterAddr)
		nexthop := net.IP(fmsg.NextHop)
		srcipstr := srcip.String()
		dstipstr := dstip.String()
		routeraddrstr := routeradd.String()
		nexthopstr := nexthop.String()
		type IPFIX struct {
			Type             string
			TimeRecvd        uint64
			SamplingRate     uint64
			SequenceNum      uint32
			TimeFlowStart    uint64
			TimeFlowEnd      uint64
			SrcIP            string
			DstIP            string
			IPversion        string
			Bytes            uint64
			Packets          uint64
			RouterAddr       string
			NextHop          string
			NextHopAS        uint32
			SrcAS            string
			DstAS            string
			SrcCountry       string
			DstCountry       string
			SrcIf            uint32
			DstIf            uint32
			Proto            uint32
			SrcPort          uint32
			DstPort          uint32
			IPTos            uint32
			ForwardingStatus uint32
			IPTTL            uint32
			TCPFlags         uint32
			SrcMac           uint64
			DstMac           uint64
			VlanID           uint32
			Etype            uint32
			IcmpType         uint32
			IcmpCode         uint32
			SrcVlan          uint32
			DstVlan          uint32
			IPv6FlowLabel    uint32
		}

		data := IPFIX{
			SrcIP:         srcipstr,
			DstIP:         dstipstr,
			Type:          string(fmsg.Type),
			TimeRecvd:     fmsg.TimeRecvd,
			SamplingRate:  fmsg.SamplingRate,
			SequenceNum:   fmsg.SequenceNum,
			TimeFlowStart: fmsg.TimeFlowStart,
			TimeFlowEnd:   fmsg.TimeFlowEnd,
			IPversion:     string(fmsg.IPversion),
			Bytes:         fmsg.Bytes,
			Packets:       fmsg.Packets,
			RouterAddr:    routeraddrstr,
			NextHop:       nexthopstr,
			NextHopAS:     fmsg.NextHopAS,
			Proto:         fmsg.Proto,
			SrcPort:       fmsg.SrcPort,
			DstPort:       fmsg.DstPort,
			VlanID:        fmsg.VlanId,
			SrcVlan:       fmsg.SrcVlan,
			DstVlan:       fmsg.DstVlan,
			IPv6FlowLabel: fmsg.IPv6FlowLabel,
		}

		marshaledJson, err := json.Marshal(data)
		if err != nil {
			return
		}

		kafkaState.producer.Input() <- &sarama.ProducerMessage{
			Topic: kafkaState.topic,
			Value: sarama.ByteEncoder(marshaledJson),
		}
	}
}
