#!/bin/env bash

RESTORE_DIRECTORY=
RESTORE_DIRECTORY_REAL_PATH=
CONTAINER_NAME=mongodb
IMAGE=mongo:4.2.10-bionic

HOST=127.0.0.1

# Local
dbSite=local
PORT=27017
USER=root 
PASSWORD=123456

AUTHENTICATION_DATABASE=admin
DUMP_DATABASE=DATABASE
DUMP_COLLECTION=$1
DUMP_PATH=dump_`echo $dbSite`_`(date +"%Y%m%d")`

# Backup
# Dump db from container to local 
# docker exec $CONTAINER_NAME mongodump -d DATABASE_NAME -o PATH_NAME -u USER -p PASSWORD
# docker exec $CONTAINER_NAME mongodump --authenticationDatabase=$AUTHENTICATION_DATABASE -u=$USER -p=$PASSWORD -d=$DUMP_DATABASE --gzip -o=$DUMP_PATH
# docker cp $CONTAINER_NAME:./$DUMP_PATH ./
# docker exec $CONTAINER_NAME rm -rf ./$DUMP_PATH

# Dump db from host
# Without tls
# mongodump --host=$HOST --port=$PORT --authenticationDatabase=$AUTHENTICATION_DATABASE -u=$USER -p=$PASSWORD -d=$DUMP_DATABASE --gzip -o=$DUMP_PATH --readPreference=secondary
# mongodump --host=$HOST --port=$PORT --authenticationDatabase=$AUTHENTICATION_DATABASE -u=$USER -p=$PASSWORD -d=$DUMP_DATABASE --collection=$DUMP_COLLECTION --gzip -o=$DUMP_PATH
# # With tls insecure, too big to dump with full db, just dump each collection
# wget https://s3.amazonaws.com/rds-downloads/rds-combined-ca-bundle.pem
mongodump --host=$HOST --port=$PORT --authenticationDatabase=$AUTHENTICATION_DATABASE --authenticationMechanism=SCRAM-SHA-256 -u=$USER -p=$PASSWORD -d=$DUMP_DATABASE --collection=$DUMP_COLLECTION --gzip -o=$DUMP_PATH
# mongodump --host=$HOST --port=$PORT --ssl --tlsInsecure --sslCAFile=rds-combined-ca-bundle.pem -u=$USER -p=$PASSWORD -d=$DUMP_DATABASE --collection=$DUMP_COLLECTION --numParallelCollections=4 --gzip -o=$DUMP_PATH --readPreference=secondary
# mongodump --host=$HOST --port=$PORT --ssl --tlsInsecure --sslCAFile=rds-combined-ca-bundle.pem -u=$USER -p=$PASSWORD -d=$DUMP_DATABASE --collection=$DUMP_COLLECTION --gzip -o=$DUMP_PATH

# Restore
# Restore db with container name
# docker cp ./$RESTORE_DIRECTORY $CONTAINER_NAME:./
# docker exec $CONTAINER_NAME mongorestore $RESTORE_DIRECTORY$RESTORE_DIRECTORY_REAL_PATH --gzip
# docker exec $CONTAINER_NAME rm -rf ./$RESTORE_DIRECTORY

# Restore db with host
# mongorestore --host=$HOST --port=$PORT --authenticationDatabase=$AUTHENTICATION_DATABASE -u=$USER -p=$PASSWORD $RESTORE_DIRECTORY$RESTORE_DIRECTORY_REAL_PATH --gzip
# mongorestore --host=$HOST --port=$PORT --ssl --tlsInsecure --sslCAFile=rds-combined-ca-bundle.pem -u=$USER -p=$PASSWORD $RESTORE_DIRECTORY$RESTORE_DIRECTORY_REAL_PATH --gzip

# mongorestore --host=$HOST --port=$PORT $RESTORE_DIRECTORY$RESTORE_DIRECTORY_REAL_PATH --gzip