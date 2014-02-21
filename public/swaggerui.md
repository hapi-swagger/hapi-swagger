
# Swagger-UI Modifications


Although every effort has been made to use the Swagger UI without modification there are times where they are needed. This repo was created to keeps historic versions and tracks the modifications.  


Current Version 2.0.10 (17-Feb-2014)

swagger.js line 829
This changes stops the word undefined been passed as a value if inputs are left empty.

    // hapi-swagger 0.1.5
    if(args[param.name] !== undefined){
      if(queryParams !== ''){
        queryParams += "&";
      }
      queryParams += encodeURIComponent(param.name) + '=' + encodeURIComponent(args[param.name]);
    }


swagger.js line 1170
Changed td width from 15% to 20% deal with font-size issue


swagger.js line 331
Changed "Response Class" to "Response Class" makes more sense for HAPI.js