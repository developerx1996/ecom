const { PRODUCT_COLLECTION } = require('../config/collections');
var db=require('../config/connection')
var collection= require('../config/collections');
const { response } = require('../app');
var objectId= require('mongodb').ObjectID
module.exports={

    addProduct:(product,callback)=>{
        console.log(product);
        db.get().collection('product').insertOne(product).then((data)=>{
        callback(data.ops[0]._id)
        })
    },
    getAllProduts:()=>{
        return new Promise(async(resolve,reject)=>{
            let products=await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })
    },
    deleteProduct:(prodId)=>{
        return new Promise((resolve,reject)=>{
        db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({_id:objectId(prodId)}).then((response)=>{
            resolve(response)
        })
    })
    },
    getProduct:(proId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(proId)}).then((product)=>{
                resolve(product)
            })
        })
    },
    editProduct:(proId,data)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION)
            .updateOne({_id:objectId(proId)},{
                $set:{
                    name:data.name,
                    description:data.description,
                    price:data.price,
                    category:data.category,
                }
            }).then((responce)=>{
                resolve(responce)
            })
        })
    },
    verifyAdmin:(adminData)=>{
       return new Promise(async(resolve,reject)=>{
        let admin= await db.get().collection(collection.ADMINLOGIN_COLLECTION).findOne({username:adminData.username})
         if(admin){ 
        if(adminData.password === admin.password){
         resolve(true)
         }else{
            resolve(false)
         }
        }else{
            resolve(false)
        }
       })
    },

    getAllOrders:()=>{
         return new Promise(async(resolve,reject)=>{
            let allOrders=await db.get().collection(collection.ORDER_COLLECTION)
                 .find({status:"placed"}).toArray()
                 
            resolve(allOrders)
         })
         
    }

}