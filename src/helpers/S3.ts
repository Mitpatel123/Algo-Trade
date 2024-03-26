"use strict"
import multer from 'multer'
import config from 'config'
import multerS3 from 'multer-s3'
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { Request, Response } from 'express'
import { apiResponse } from '../common'
import { logger, reqInfo } from './winston_logger'
import sharp from 'sharp'
import { responseMessage } from './response'
import multer_s3_transform from 'multer-s3-transform'


const aws: any = config.get('aws')

const s3Client = new S3Client({
    region: aws.region,
    credentials: {
        accessKeyId: aws.accessKeyId,
        secretAccessKey: aws.secretAccessKey,
    }
})

const bucket_name = aws.bucket_name

export const URL_decode = (url) => {
    try {
        let folder_name = [], image_name
        url.split("/").map((value, index, arr) => {
            image_name = url.split("/")[url.split("/").length - 1]
            folder_name = (url.split("/"))
            folder_name.splice(url.split("/").length - 1, 1)
        })
        return [folder_name.join('/'), image_name]
    }
    catch (error) {
        console.log(error)
        return error
    }
}

export const streamToBuffer = async (stream) => {
    return new Promise((resolve, reject) => {
        const chunks = [];
        stream.on("data", (chunk) => chunks.push(chunk));
        stream.on("error", reject);
        stream.on("end", () => resolve(Buffer.concat(chunks)));
    });
}

export const getS3File = async function (filepath: any,) {
    return new Promise(async function (resolve, reject) {
        try {
            let param = {
                Bucket: bucket_name, // your bucket name,
                Key: `${filepath}` // path to the object you're looking for
            }
            const response: any = await s3Client.send(new GetObjectCommand(param))
            resolve(response)
        } catch (error) {
            console.log("S3 GET ERROR ", error)
            resolve(false)
        }
    })
}

const compresImage = (fileSize, req) => {
    const inputFilePath = req.file.path;
    const outputFilePath = `compressed_${req.file.originalname}`;

    const compressionOptions = {
        quality: 80 // Adjust the quality value as needed (0-100)
    };

    sharp(inputFilePath)
        .jpeg(compressionOptions)
        .toFile(outputFilePath)
    return outputFilePath
    //   .then(() => {
    //     res.json({ message: 'Image compression completed.', compressedImage: outputFilePath });
    //   })
    //   .catch(err => {
    //     res.status(500).json({ error: 'An error occurred while compressing the image.' });
    //   });

}

// export const upload_all_type = async function (image, bucketPath) {
//     return new Promise(async function (resolve, reject) {
//         try {
//             // image.data = await compressImage(image)
//             var params = {
//                 Bucket: `${bucket_name}`,
//                 Key: `${bucketPath}/${image.name}`,
//                 Body: image.data,
//                 ContentType: image?.ContentType,
//                 ACL: "public-read"
//             };
//             logger.debug("Uploading S3");
//             const result = await s3Client.send(new PutObjectCommand(params));
//             logger.debug("Successfully uploaded data ");
//             resolve(`${aws?.bucketURL}/${bucketPath}/${image.name}`)
//         } catch (error) {
//             console.log(error);
//             reject()
//         }
//     })
// }

export const uploadS3 = multer({
    storage: multerS3({
        s3: s3Client,
        bucket: bucket_name, 
        acl: 'public-read',
        contentType: multerS3.AUTO_CONTENT_TYPE,
        metadata: function (req: any, file, cb) {
            cb(null, { fieldName: file.fieldname });
        },
        key: function (req: any, file, cb) {
            const file_type = file.originalname.split('.')
            // let  fileSize = (parseInt(req.headers['content-length']) / 1048576).toFixed(2)
            // let fileLocation = `${req.header('user')?._id}/${req.params.file}/${Date.now().toString()}.${file_type[file_type.length - 1]}`
            // console.log('fileLocation', fileLocation)
            // if (+fileSize > 1) {
            //    const temp =  compresImage(fileSize, req)
            // }else{
            //     console.log('fail')
            // }

            // req.body.size = parseInt(req.headers['content-length']) / 1048576
            // req.body.location = `${req.header('user')?._id}/${req.params.file}/${Date.now().toString()}.${file_type[file_type.length - 1]}`
            // file.filename = `https://patramkids.s3.ap-south-1.amazonaws.com/${Date.now().toString()}/${req.params.file}/${file.originalname}`

            file.filename = `https://patramkids.s3.ap-south-1.amazonaws.com/${Date.now().toString()}/${file.originalname}`
            cb(
                null,
                // `${Date.now().toString()}/${req.params.file}/${file.originalname}`
                `${Date.now().toString()}/${file.originalname}`
            );
        },
    }),
});

export const compress_image = multer({
    storage: multer_s3_transform({
        s3: s3Client,
        bucket: bucket_name,
        acl: 'public-read',
        contentType: multerS3.AUTO_CONTENT_TYPE,
        shouldTransform: function (req, file, cb) {
            cb(null, { fieldName: file.fieldname })
        },  
        transforms: [{
            id: 'thumbnail',
            key: async function (req, file, cb) {
                file.filename = `https://patramkids.s3.ap-south-1.amazonaws.com/${Date.now().toString()}/${file.originalname}`
                cb(null, `${Date.now().toString()}/${file.originalname}`)
            },
            transform: function (req, file, cb) {
                cb(null, sharp().withMetadata().jpeg({ quality: 50 }))
            }
        }]
    })
})


export const file_upload_response = async (req: any, res: Response) => {
    reqInfo(req)
    try {
        return res.status(200).json({
            status: 200,
            message: responseMessage.fileUploadSuccess,
            data: { image: req.file?.location }
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json(new apiResponse(500, "Internal Serve Error", {}, error));
    }
}

// export const pdf_file_upload_response = async (req: any, res: Response) => {
//     reqInfo(req)
//     try {
//         let compress_image = await compress_pdf(req.file?.location)
//         return res.status(200).json({
//             status: 200,
//             message: responseMessage.fileUploadSuccess,
//             data: { image: req.file?.location, compress_image }
//         })
//     } catch (error) {
//         console.log(error)
//         return res.status(500).json(new apiResponse(500, "Internal Serve Error", {}, error));
//     }
// }

export const file_upload = async (req: any, res: Response) => {
    reqInfo(req)
    try {
        return res.status(200).json({
            status: 200,
            message: responseMessage.fileUploadSuccess,
            data: { image: req.file?.location }
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json(new apiResponse(500, "Internal Serve Error", {}, error));
    }
}

// export let uploadS3 = multer({
//     storage: multerS3({
//         s3: s3Client,
//         bucket: bucket_name,
//         metadata: function (req, file, cb) {
//             cb(null, { fieldName: file.fieldname });
//         },
//         key: function (req, file, cb) {
//             console.log('file', file)
//             return
//             const file_type = file.originalname.split('.')
//             cb(
//                 null,
//                 file.filename = `https://patramkids.s3.ap-south-1.amazonaws.com/${Date.now().toString()}.${file_type[file_type.length - 1]}`
//             );
//         }
//     }),
// })



// export const uploadFiles = (req, res, next, param) => {
//     const uploads3 = multer({
//         storage: multers3({
//             s3: s3Client,
//             bucket: bucket_name,
//             metadata: function (req, file, cb) {
//                 cb(null, { fieldName: file.fieldname });
//             },
//             key: function (req, file, cb) {
//                 cb(null, Date.now().toString() + '-' + file.originalname)
//             }
//         }),
//         limits: {
//             fileSize: 10000000
//         },
//     }).fields(param.param)

//     uploads3(req, res, (error) => {
//         if (error instanceof multer.MulterError)
//             return res.status(400).json({
//                 message: 'Upload unsuccessful',
//                 errorMessage: error.message,
//                 errorCode: error.code
//             })
//         if (error)
//             return res.status(500).json({
//                 message: 'Error occured',
//                 errorMessage: error.message
//             })
//         next()
//     })
// }