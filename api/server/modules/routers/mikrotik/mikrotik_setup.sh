:global sharedSecret "{sharedSecret}" ;{~n}
:global radiusIp "{radiusIp}" ;{~n}
:global radiusAccPort "{radiusAccPort}" ;{~n}
:global radiusAuthPort "{radiusAuthPort}" ;{~n}
:global nasIdentity "{nasId}" ;{~n}
:global hotspotDomain     "{hotspotDomain}" ;{~n}

/system identity set name $nasIdentity  ;{~n}
:put "Nas identity changed." ;{~n}
/system ntp client set enabled=yes primary-ntp=193.190.147.153  ;{~n}
:put "Ntp adjusted" ;{~n}
/system clock manual set time-zone=+03:30  ;{~n}
:put "Clock adjusted" ;{~n}
/system clock set time-zone-name=Asia/Tehran  ;{~n}
:put "Timezone changed" ;{~n}
/radius add service=hotspot address=$radiusIp secret=$sharedSecret authentication-port=$radiusAuthPort accounting-port=$radiusAccPort timeout=00:00:05.00 ;{~n}

/ip hotspot walled-garden add dst-host=$hotspotDomain action=allow ;{~n}
:put "Walled garden added for hotspot" ;{~n}
/ip hotspot walled-garden add dst-host=zarinpal.com action=allow ;{~n}
:put "Walled garden added for: zarinpal.com" ;{~n}
/ip hotspot walled-garden add dst-host=*.zarinpal.com action=allow ;{~n}
:put "Walled garden added for: *.zarinpal.com" ;{~n}
/ip hotspot walled-garden add dst-host=pay.ir action=allow ;{~n}
:put "Walled garden added for: pay.ir" ;{~n}
/ip hotspot walled-garden add dst-host=*.pay.ir action=allow ;{~n}
:put "Walled garden added for: *.pay.ir" ;{~n}
/ip hotspot walled-garden add dst-host=hotspotplus.ir action=allow ;{~n}
:put "Walled garden added for: hotspotplus.ir" ;{~n}
/ip hotspot walled-garden add dst-host=*.hotspotplus.ir action=allow ;{~n}
:put "Walled garden added for: *.hotspotplus.ir" ;{~n}
/ip hotspot walled-garden add dst-host=*.spotio.ir action=allow ;{~n}
:put "Walled garden added for: *.spotio.ir" ;{~n}
/ip hotspot walled-garden add dst-host=*.shaparak.ir action=allow ;{~n}
:put "Walled garden added for: *.shaparak.ir" ;{~n}
:put "Done!, welcome to hotspot plus" ;{~n}