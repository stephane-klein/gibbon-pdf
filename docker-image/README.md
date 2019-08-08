Test application with Docker:

```
$ docker-compose up -d
```

Go to http://127.0.0.1:5000

Curl example:

```
$ curl -d '{"invoice_id": "42"}' -H "Content-Type: application/json" -X POST http://localhost:5000/v1/templates/invoice/pdf --output invoice.pdf
$ open invoice.pdf
```

Build Docker image:

```
$ ./build.sh
```