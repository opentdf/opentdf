brew install nginx
#create backup of original nginx.conf
cp $(brew --prefix)/etc/nginx/nginx.conf $(brew --prefix)/etc/nginx/nginx.conf.bak
#copy over the nginx.conf template file from our quickstart directory
mv ./nginx-reverse-proxy-template.conf $(brew --prefix)/etc/nginx/nginx.conf
#start up nginx server
sudo nginx


