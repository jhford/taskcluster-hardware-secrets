cat > sample.json << EOF
{
  "name": "test",
  "payload": "payloadtest",
  "allowed": []
}
EOF

# Putting
curl -X PUT http://jhford.corp.ber1.mozilla.com:8080/v1/secret/test -H 'Content-Type: application/json' -d @sample.json
curl -X PUT http://jhford.corp.ber1.mozilla.com:8080/v1/secret/test -H 'Content-Type: application/json' -d @sample.json
curl -X POST http://jhford.corp.ber1.mozilla.com:8080/v1/secret/test -H 'Content-Type: application/json' -d @sample.json
curl -X GET http://jhford.corp.ber1.mozilla.com:8080/v1/secret/test
#curl -X DELETE http://jhford.corp.ber1.mozilla.com:8080/v1/secret/test
