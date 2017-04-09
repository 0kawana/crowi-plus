#!/bin/sh

# Trigger a new run
# see: http://devcenter.wercker.com/docs/api/endpoints/runs#trigger-a-run

# exec curl
#
# require
#   - $WERCKER_TOKEN
#   - $CROWI_PLUS_DOCKER_PIPELINE_ID
#   - $RELEASE_VERSION
#
DATA=`echo '{ \
    "pipelineId": "'$CROWI_PLUS_DOCKER_PIPELINE_ID'", \
    "branch": "release", \
    "envVars": [ \
      { \
        "key": "RELEASE_VERSION", \
        "value": "'$RELEASE_VERSION'" \
      } \
    ] \
  }' \
`
echo $DATA

RESPONSE=`curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $WERCKER_TOKEN" \
  https://app.wercker.com/api/v3/runs -d '{ \
    "pipelineId": "'$CROWI_PLUS_DOCKER_PIPELINE_ID'", \
    "branch": "release", \
    "envVars": [ \
      { \
        "key": "RELEASE_VERSION", \
        "value": "'$RELEASE_VERSION'" \
      } \
    ] \
  }' \
`

echo $RESPONSE | jq .

# get http status code
STATUS_CODE=`echo $RESPONSE | jq .statusCode`

# exit
if [ "$STATUS_CODE" = 200 ]; then
  exit 0
else
  exit 1
fi
