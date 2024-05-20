
function addToCart(prodId){
  $.ajax({
   url:'/add-to-cart/'+prodId,
   method:'get',
   success:(response)=>{
     if(response){
        let count=$('#cart-count').html()
        count=parseInt(count)+1
        $('#cart-count').html(count)
      }     
   }
  })
} 
