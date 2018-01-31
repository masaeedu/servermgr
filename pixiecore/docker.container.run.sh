image=servermgr-pixiecore
container=$image

docker rm -f $container
docker run -i -p 67:67 -p 69:69 -p 4011:4011 --network="host" -h $container --name $container -d $image
