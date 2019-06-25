let event = {

};


let lambdaModule = require('./../lambdaFunctions/getUserImages.js')

lambdaModule.handler(event).then((result) =>{
    console.log('Lambda resposne', result);
}).catch((err) =>{
    console.log('Lambda error resposne', err);
});
