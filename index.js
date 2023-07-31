import {
  AbortMultipartUploadCommand,
  CreateMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  GetObjectAttributesCommand,
  GetObjectCommand,
  S3Client,
  UploadPartCommand
} from "@aws-sdk/client-s3";

const tenMB = 10 * 1024 * 1014;

const createString = (size = tenMB) => {
  return "x".repeat(size);
};

const uploadFile = async (client, bucketName, key) => {
  console.log(`Uploading ${key} using multipart upload`);
  // Sourced from: https://docs.aws.amazon.com/AmazonS3/latest/userguide/mpu-upload-object.html
  const str = createString();
  const buffer = Buffer.from(str, "utf-8");

  let uploadId;

  try {
    const multipartUpload = await client.send(
      new CreateMultipartUploadCommand({
        Bucket: bucketName,
        Key: key,
        ChecksumAlgorithm: 'SHA256'
      })
    );

    uploadId = multipartUpload.UploadId;

    const uploadPromises = [];
    // Multipart uploads require a minimum size of 5 MB per part.
    let partSize = 5242880;
    const parts = Math.ceil(buffer.length / partSize);

    // Upload each part in 5MB parts.
    for (let i = 0; i < parts; i++) {
      const start = i * partSize;
      const end = start + partSize;
      uploadPromises.push(
        client
          .send(
            new UploadPartCommand({
              Bucket: bucketName,
              Key: key,
              UploadId: uploadId,
              Body: buffer.subarray(start, end),
              PartNumber: i + 1,
              ChecksumAlgorithm: "SHA256"
            })
          )
          .then((d) => {
            console.log("Part", i + 1, "uploaded");
            return d;
          })
      );
    }

    const uploadResults = await Promise.all(uploadPromises);

    return await client.send(
      new CompleteMultipartUploadCommand({
        Bucket: bucketName,
        Key: key,
        UploadId: uploadId,
        MultipartUpload: {
          Parts: uploadResults.map(({ ETag, ChecksumSHA256 }, i) => ({
            ETag,
            ChecksumSHA256,
            PartNumber: i + 1
          }))
        }
      })
    );
  } catch (err) {
    console.error(err);

    if (uploadId) {
      const abortCommand = new AbortMultipartUploadCommand({
        Bucket: bucketName,
        Key: key,
        UploadId: uploadId
      });

      await client.send(abortCommand);
    }
  }
};

const downloadFile = async (client, bucketName, key) => {
  console.log(`Downloading file ${key} using GetObject`);
  return await client.send(
    new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
      ChecksumMode: "ENABLED"
    })
  );
};

const getFileAttributes = async (client, bucketName, key) => {
  console.log(`GetObjectAttributes for file ${key}`);
  return await client.send(
    new GetObjectAttributesCommand({
      Bucket: bucketName,
      Key: key,
      ObjectAttributes: ["Checksum"]
    })
  );
};

const main = async () => {
  const bucketName = "example-bucket-name"; // Replace this with an appropriate bucket name
  const key = "multipart.txt";

  const client = new S3Client({});
  const uploadResult = await uploadFile(client, bucketName, key);
  console.log("Multipart upload result - Checksum of checkums", uploadResult.ChecksumSHA256);

  const attributeResult = await getFileAttributes(client, bucketName, key);
  console.log("GetObjectAttributes - Checksum of checkums", attributeResult?.Checksum?.ChecksumSHA256);

  const downloadResult = await downloadFile(client, bucketName, key);
  console.log((await downloadResult.Body?.transformToString()).length);
};

main();
