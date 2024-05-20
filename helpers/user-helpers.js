var db=require('../config/connection')
var collection= require('../config/collections')
const bcrypt= require('bcrypt')
var objectId=require('mongodb').ObjectID
const { response } = require('../app')

const Razorpay=require('razorpay')
const { resolve } = require('path')
const { rejects } = require('assert')
var instance = new Razorpay({
    key_id: 'rzp_test_4FgF4bgIznCzOo',
    key_secret: 'yhGrOXjjpvVkEvomIKovzUcz',
});
module.exports={
    doSignup:(userData)=>{
         return new Promise(async(resolve,reject)=>{
         userData.password=await bcrypt.hash(userData.password,10)
         db.get().collection(collection.USER_COLLECTIONS).insertOne(userData).then((data)=>{  

               resolve(data.ops[0])
            
         })
         
         }) 
    },

    doLogin:(userData)=>{
        return new Promise(async(resolve,reject)=>{
        let loginStatus=false
        let response={}
        let user=await db.get().collection(collection.USER_COLLECTIONS).findOne({email:userData.email})
        if(user){
            bcrypt.compare(userData.password,user.password).then((status)=>{
                if(status){
                     console.log('login success')
                     response.user=user
                     response.status=true
                     resolve(response)
                }else{
                    console.log('password error')
                    resolve({status:false})
                }
              })
          }else{
                 console.log('user not found')
                 resolve({status:false})
          }
        })
    },
    addToCart:(proId,userId)=>{
        prodObj={
            item:objectId(proId),
            quantity:1
        }
        return new Promise(async(resolve,reject)=>{
          let userCart= await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
           if(userCart){
            let prodExist=userCart.products.findIndex(products=>products.item==proId)
            console.log(prodExist)
            if(prodExist!=-1){
                db.get().collection(collection.CART_COLLECTION)
                   .updateOne({user:objectId(userId),'products.item':objectId(proId)},
                   {
                    $inc:{'products.$.quantity':1}
                   }
                ).then(()=>{
                    resolve()
                })
            }else{

            db.get().collection(collection.CART_COLLECTION)
            .updateOne({user:objectId(userId)},
               {
                   $push:{products:prodObj}
               }
                 ).then(()=>{
                   resolve()

                  })
             }
           }else{
              let cartObj={
                user:objectId(userId),
                products:[prodObj]
              }
              db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response)=>{
                resolve(response)
                 })
           }
        })
    },
   getCartProducts:(userId)=>{
       return new Promise(async(resolve,reject)=>{
        let cartItems=await db.get().collection(collection.CART_COLLECTION).aggregate([
            {
                $match:{user:objectId(userId)}
            },
            {
                $unwind:'$products'
            },
            {
                $project:{
                    item:'$products.item',
                    quantity:'$products.quantity'
                }
            },
            {
                $lookup:{
                    from:collection.PRODUCT_COLLECTION,
                    localField:'item',
                    foreignField:'_id',
                    as:'product'
                }
            },
            {
                $project:{
                    item:1,
                    quantity:1,
                    product:{$arrayElemAt:['$product',0]}
                }
            }
        ]).toArray()
         console.log('cart items:'+cartItems)
         resolve(cartItems)
       })
   },

   getCartCount:(userId)=>{
     return new Promise(async(resolve,reject)=>{
        let count=0
        let cart= await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
        if(cart){
            count=cart.products.length
        }
        console.log("the cartcount is : "+count)
        resolve(count)
       
     })
   },

   changeProductQuantity:(details)=>{
     quantity=parseInt(details.quantity)
     count=parseInt(details.count)
     if (quantity==1 && count==-1){ 
   //     if (confirm("Are you sure you want to remove this item?")) {
            return new Promise((resolve, reject) => {
                db.get().collection(collection.CART_COLLECTION)
                    .updateOne(
                        { _id: objectId(details.cart) },
                        { $pull: { products: { item: objectId(details.product) } } }
                    )
                    .then((response) => {
                        let removed= true
                        resolve({count,removed});
                    })
            });
    //    }     // conform
        
     }else
     return new Promise((resolve,reject)=>{ 
        db.get().collection(collection.CART_COLLECTION)
           .updateOne({_id:objectId(details.cart),'products.item':objectId(details.product)},
        {
          $inc:{'products.$.quantity':count}
        }
        ).then((response)=>{
            let removed= false
            resolve({count,removed})
          })
      })
   },     

   removeItem: (details) => {
    return new Promise((resolve, reject) => {
        db.get().collection(collection.CART_COLLECTION)
            .updateOne(
                { _id: objectId(details.cart) },
                { $pull: { products: { item: objectId(details.product) } } }
            )
            .then((response) => {
                resolve(true);
            })
    });
   },

  getTotalAmount:(userId)=>{
    return new Promise(async (resolve,reject)=>{
       let total=await db.get().collection(collection.CART_COLLECTION).aggregate([
         { 
            $match: {user:objectId(userId)}
         },
         {
            $unwind:'$products'
         },
       {
            $project:{
                item:'$products.item',
                quantity:'$products.quantity'
            }
         },
         {
            $lookup:{
                from:collection.PRODUCT_COLLECTION,
                localField:'item',
                foreignField:'_id',
                as:'product'
            }
         },
         {
            $project:{
                item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
            }
         },
         {
            $group:{
                _id:null,
                total:{$sum:{$multiply:[{$toDouble:'$quantity'}, {$toDouble:'$product.price'}]}}
            }   
        }
          
       ]).toArray();
       console.log("RESULT IS: ",total)
       resolve(total[0].total)
    })
   },  

   placeOrder:(order,products,total,userId)=>{
       return new Promise((resolve,reject)=>{
          console.log("PLACE ORDER STARTED")
          console.log(order,products,total,userId)
          let status=order.paymentMethod==='cod'?'placed':'pending'
          let orderObj={
            deliveryDetails:{
                  mobile:order.mobile,
                  address:order.address,
                  pincode:order.pin
            },
            userId:objectId(userId),
            paymentMethod:order.paymentMethod,
            products:products,
            amount:total,
            status:status,
            date: new Date()
          }
          db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response)=>{
            db.get().collection(collection.CART_COLLECTION).removeOne({user:objectId(userId)})
             resolve(response.ops[0])
          })
       })
   },

   getCartProductsList:(userId)=>{
       return new Promise(async(resolve,reject)=>{
         let cart= await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
         resolve(cart.products)
       })
   },
    
   getOrderList:(userId)=>{
       return new Promise(async(resolve,reject)=>{
          let orderList = await db.get().collection(collection.ORDER_COLLECTION)
                 .find({userId:objectId(userId)}).toArray()
          resolve(orderList)
       })
   },
   viewProducts:(orderId)=>{
    console.log("orderID IS :",orderId)
     return new Promise(async(resolve,reject)=>{
      let orderedItems= await db.get().collection(collection.ORDER_COLLECTION).aggregate([
            {$match:{_id:objectId(orderId)}},
            {$unwind:'$products'},
            {$project:{
                item:'$products.item',
                quantity:'$products.quantity'
            }},
         {$lookup:{
                from:collection.PRODUCT_COLLECTION,
                localField:'item',
                foreignField:'_id',
                as:'product'
            }},
            {$project:{
                    item:1,
                    quantity:1,
                    product:{$arrayElemAt:['$product',0]}
                }} 
        ]).toArray()
        resolve(orderedItems)
     })
   },

   generateRazorpay:(orderId,total)=>{
    return new Promise((resolve,reject)=>{
        var options = {
            amount: total*100,  
            currency: "INR",
            receipt: ""+orderId
          };
          instance.orders.create(options, function(err, order) {
            if(err){
              console.log("the error is :",err)
            }else{
            console.log("THE ORDER IS: ",order);
            resolve(order)
            }
            
          });    
          
    })  

   },

   verifyPayment:(details)=>{
       console.log("SHA256 STARTED")
       return new Promise((resolve,reject)=>{
        const crypto = require('crypto')
        let hmac= crypto.createHmac('sha256','yhGrOXjjpvVkEvomIKovzUcz')
        hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]'])
        hmac=hmac.digest('hex')

        if(hmac===details['payment[razorpay_signature]']){
            console.log("THE PAYMENT VERIFIED")
            resolve()
        }else{
            console.log("THE PAYMENT FAILED @ HMAC")
            reject()
        }

       })
   },


  changePaymentStatus:(orderId) => {
    return new Promise(async(resolve, reject) => {
     await db.get().collection(collection.ORDER_COLLECTION)
        .updateOne(
          { _id: objectId(orderId) },
          { $set: { status: 'Placed' } }
        )
        .then(() => {
          resolve();
        })
    });
   }

}    //close


  
  

