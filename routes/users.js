var express = require('express');
const productHelpers = require('../helpers/product-helpers');
var router = express.Router();
var productHelper=require('../helpers/product-helpers')
var userHelper=require('../helpers/user-helpers');
const { response } = require('../app');
 

const verifyLogin=(req,res,next)=>{
    if(req.session.loggedIn){
        next()
    }else{
        res.redirect('/login')
    }
}
/* GET home page. */

router.get('/',async function(req, res, next) {
    let user=req.session.user
    let cartCount=null
    if(user){
        cartCount=await userHelper.getCartCount(user._id)
    }
    productHelper.getAllProduts().then((products)=>{
    res.render('users/view-products',{products,user,cartCount})
    })


});

router.get('/login',function(req,res){
    if(req.session.loggedIn){
        res.redirect('/')
    }else{
    res.render('users/login',{"LoginErr":req.session.loginErr})
    req.session.loginErr=false
    }
})
router.get('/signup',(req,res)=>{
    res.render('users/signup')
})
router.post('/signup',(req,res)=>{
       userHelper.doSignup(req.body).then((response)=>{  
            req.session.loggedIn=true
            req.session.user=response
            res.redirect('/')   
   })      
})

router.post('/login',(req,res)=>{
    userHelper.doLogin(req.body).then((response)=>{
        if(response.status){
            req.session.loggedIn=true
            req.session.user=response.user
            res.redirect('/')
        }else{
            req.session.loginErr="!!invalid username or password"
            res.redirect('/login')
        }
    })
})

router.get('/logout',(req,res)=>{
    req.session.destroy()
    res.redirect('/')
})
// for getting cart items and display
router.get('/cart',verifyLogin,async(req,res)=>{
   let products= await userHelper.getCartProducts(req.session.user._id)
   let total=0
   if(products.length>0){
       total= await userHelper.getTotalAmount(req.session.user._id)
         }
        res.render('users/cart',{products,user:req.session.user,total})   
})       


// addToCart with AJAX
router.get('/add-to-cart/:id',(req,res)=>{
   userHelper.addToCart(req.params.id,req.session.user._id).then(()=>{
     res.json(true)
   })

})  

router.post('/change-product-quantity',(req,res,next)=>{
   userHelper.changeProductQuantity(req.body).then(async(resolvedData)=>{
       const { count, removed } = resolvedData
       let total=await userHelper.getTotalAmount(req.session.user._id)
       res.json({ count: count, removed: removed,total:total});


   })
})

router.post('/remove-item',(req,res)=>{
    userHelper.removeItem(req.body).then(()=>{
        res.json(true)
    })
})

router.get('/place-order',verifyLogin, async (req,res)=>{
    console.log("GOING TO CALL DELIVERY DETAILS")
    let total= await userHelper.getTotalAmount(req.session.user._id)
    res.render('users/place-order',{total})
})

router.post('/place-order', async(req,res)=>{
    console.log("REQ IS: ",req.body)
    let userId= req.session.user._id
    let products= await userHelper.getCartProductsList(req.session.user._id)
    let total= await userHelper.getTotalAmount(req.session.user._id)
    userHelper.placeOrder(req.body,products,total,userId).then((response)=>{ 
        console.log("RESPONSE IS: ",response)     
        if(req.body['paymentMethod']==='cod'){
            res.json({status:true})
        }else{            
            userHelper.generateRazorpay(response._id,total).then((response)=>{
                res.json({response,status:false})
            })  

        }
    }) 
})

router.get('/order-placed',(req,res)=>{
    res.render('users/order-conformed')
})
 
router.get('/orders-list',verifyLogin,(req,res)=>{
    userHelper.getOrderList(req.session.user._id).then((orderList)=>{
    res.render('users/orders-list',{orderList})
    })
});

router.get('/view-products/:id',(req,res)=>{
    userHelper.viewProducts(req.params.id).then((orderedItems)=>{
        res.render('users/view-ordered-items',{orderedItems})
    })
});

router.get('/cancel-order',(req,res)=>{
    
});  
router.post('/verify-payment',(req,res)=>{
    console.log(req.body) 
    userHelper.verifyPayment(req.body)
    .then(()=>{
        userHelper.changePaymentStatus(req.body['order[receipt]']).then(()=>{
            res.json({status:true})
        })
    }).catch(()=>{
    res.json({status:false})
    })
}); 




module.exports = router;