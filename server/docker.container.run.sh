image=servermgr-server
container=$image

docker rm -f $container
docker run -i -p 1234:1234 --network="host" -h $container --name $container -d $image
#docker run -i -p 1234:1234 --entrypoint=/bin/bash -h $container --name $container -d $image
