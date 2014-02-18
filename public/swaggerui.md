
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