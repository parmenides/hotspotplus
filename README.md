### Hotspotplus Installation

#### Install Docker
https://docs.docker.com/docker-for-mac/install/

#### Install Docker Compose
https://docs.docker.com/compose/install/
#### Connect to the server and edit sysctl.conf file and add these to line to the end of file and save.
/etc/sysctl.conf
```config
vm.max_map_count = 300000
fs.file-max = 70000
```
##### Connect to the server via terminal and run these commands
```bash
#Connect via terminal
$ssh  root@YourServerIP
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

#### Go to http://YourServerIP:9001 and follow these steps:
1. Create a new user 
2. Select **Docker** box.
3. Go to **Stacks** click **Add Stack**
4. Select **git Repository**
- Repository URL: https://github.com/parmenides/hotspotplus
- Repository reference: master
- Compose path: config/docker-compose-swarm.yml
- Add Environment Variables:
  | Variable   | Value | Description | example |
  |---|---|---|---| 
  | config_dir  | /home/hotspotplus/hotspotplus/config  | config folder path  | |
  | admin_password  |     | Administrator password | yF9Jn1vEG2u7BpaLzCgn | 
  | admin_username  |     | Admin username  | admin |
  | encryption_key  |     | Strong Encryption key username  | yF9Jn1vEG2u7BpaLzCgn |
  | payment_api_key  |    | Payping Oauth2.0 API_KEY https://www.payping.ir/ |  |
  | payping_client_id  |    | Payping Oauth2.0 CLIENT_ID https://www.payping.ir/ |  |
  | payping_app_token  |    | Payping Oauth2.0 APP_TOKEN https://www.payping.ir/ |  |
  | panel_address  | #4%^GdVb3&!fgKaP#   | Your domain address | https://my.prohotspotplus.com |




#### Start development
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
http://my.yourdomainname/src/#/access/signin

#### Hotspot Login:
http://wifi.yourdomainname
