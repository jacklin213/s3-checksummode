# s3-checksummode
Simple reproduction of s3 checksum mode issue for multipart uploaded files

## Instructions
1. Ensure you have valid AWS credentials configured
2. Replace the `bucketName` on line 119 with the name of the bucket
3. Run `npm start` to perform a multipart upload of a 10MB file, retrival using GetObjectAttributes and then Checksum mismatch error on GetObject

Sample logs
```
$ npm start

> s3-checksummode@1.0.0 start
> node index.js

Uploading multipart.txt using multipart upload
Part 1 uploaded
Part 2 uploaded
Multipart upload result - Checksum of checkums mHB8HONJyh7rfIdkdP+zmuj+WpVE59Zak7FzTLbtIaI=-2
GetObjectAttributes for file multipart.txt
GetObjectAttributes - Checksum of checkums mHB8HONJyh7rfIdkdP+zmuj+WpVE59Zak7FzTLbtIaI=
Downloading file multipart.txt using GetObject
Promise { <pending> }
C:\GitHub\s3-checksummode\node_modules\@aws-sdk\middleware-flexible-checksums\dist-cjs\validateChecksumFromResponse.js:21
            throw new Error(`Checksum mismatch: expected "${checksum}" but received "${checksumFromResponse}"` +
                  ^

Error: Checksum mismatch: expected "EYjbVvTmA+u/bYKvB+581GRo8b1lcQWsR5vpy7KFcas=" but received "mHB8HONJyh7rfIdkdP+zmuj+WpVE59Zak7FzTLbtIaI=-2" in response header "x-amz-checksum-sha256".
    at validateChecksumFromResponse (C:\GitHub\s3-checksummode\node_modules\@aws-sdk\middleware-flexible-checksums\dist-cjs\validateChecksumFromResponse.js:21:19)
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)

Node.js v18.17.0
```