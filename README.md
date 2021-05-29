### Hotspotplus Installation

#### Install docker and docker compose

- [Docker installation guid](https://docs.docker.com/docker-for-mac/install/)
- [Docker post installation guid](https://docs.docker.com/engine/install/linux-postinstall/)
- [Docker compose installation guid](https://docs.docker.com/compose/install/)

#### Connect to the server and edit sysctl.conf file and add the following line to the end of sysctl.conf file and save.
Path: /etc/sysctl.conf
```text
vm.max_map_count = 300000
fs.file-max = 70000
```
#### Connect to the server via terminal and run these commands
```bash
#Connect via terminal
$ssh  root@your_server_ip
# Create a new user
$adduser hotspotplus
# Add sudo permission
$usermod -aG sudo hotspotplus
# Switch to hotspotplus user
$su hotspotplus
# Disable UFW firewall
$sudo ufw disable
# Enable docker swarm
$docker swarm init

# Move to home 
$cd ~
# Pull source code
$git clone https://github.com/parmenides/hotspotplus.git

# Prepare portainer
$docker volume create portainer_data
$docker run -d -p 8001:8000 -p 9001:9000 --name=portainer --restart=always -v /var/run/docker.sock:/var/run/docker.sock -v portainer_data:/data portainer/portainer-ce
```

#### Required DNS A record

|Description| Domain | IPv4 address
  |---|---|---|
|Main domain| http://your_domain | your_server_ip |
|Hotspot domain| http://wifi.your_domain | your_server_ip |
|Dashboard domain| http://my.your_domain | your_server_ip |
|API domain| http://api.your_domain | your_server_ip |

#### Go to http://your_server_ip:9001 and follow these steps:
1. Create a new user 
2. Select **Docker** box.
3. Go to **Stacks** click **Add Stack**
4. Select **Web Editor**
- Download and open [docker-compose-swarm.yml](https://github.com/parmenides/hotspotplus/blob/master/config/docker-compose-swarm.yml) file with a simple text editor
- Open file and replace your_domain with your real domain (example: **hotspotplus.ir**)  
- copy docker-compose-swarm.yml content into the web editor
- Add the following Environment Variables:
  
  | Name | Value | Description |
  |---|---|---|
  | project_dir | /home/hotspotplus/hotspotplus | project folder path on the server(Required) |
  | admin_password | 123 | Administrator password (Required) | 
  | admin_username | admin | Administrator username (Required) |
  | encryption_key | 123 | Strong encryption key (Required) |
  | payment_api_key | 123 | PayPing OAuth2.0 API_KEY | 
  | payping_client_id | Hotspotplus | PayPing OAuth2.0 CLIENT_ID (Optional) | 
  | payping_app_token | 123 | PayPing OAuth2.0 APP_TOKEN (Optional) | 
  | panel_address | http://my.your_domain | Your dashboard domain address (Required)|
  | your_domain | http://your_main_domain | Your main domain address (Required)|
  | radius_shred_secret | 3ymUG6JVK | Radius secret (Required)| 
  | radius_ip | your_server_ip | Radius server IP address (Required)|  
  | sms_api_token |  | Kavehnegar api token|
  | sms_signature |  | Sms signature |

### Start development
```bash
# create docker network on first time
$docker network create hotspotplusgate

# cd to project directory
$cd project_directory

# to install dependencies
$npm install

# to run project
$npm start
```

#### Hotspotplus Dashboard:
http://my.your_domain/src/#/access/signin

#### Hotspot Login:
http://wifi.your_domain
