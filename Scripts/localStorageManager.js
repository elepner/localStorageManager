(function(){
    if(window.getLocalStorageManager){
        return;
    }
    
    var managerObject = {};
    var storageCheckingTime = 1;
    function setObject(key, object, expiry){
        var expirationTime;
        if(expiry){
            var timeObject = new Date(); 
            var expirationTime = new Date(timeObject.getTime() + 1000*expiry); 
        }
        
        object.expiry = expirationTime;
        localStorage.setItem(key, JSON.stringify(object));
    }
    
    //TODO Add checks from that the localstorage is supported
    managerObject.set = function(key, value, expiry){
        var storageObject = {
            value: value,
        }        
        setObject(key, storageObject, expiry);
    }
    
    managerObject.get = function(key){
        return JSON.parse(localStorage.getItem(key)).value;
    }
    
    managerObject.remove = function(key){
        localStorage.removeItem(key)
    }
    
    managerObject.setProperty = function(key, property, value, expiry){
        var storedObject = JSON.parse(localStorage.getItem(key)) || {};
        var actualObject = storedObject.value;
        
        if(typeof actualObject === 'undefined' || actualObject === null){
            actualObject = {property : value};
        }
        if(typeof actualObject === 'object'){
            actualObject[property] = value;
        } else{
            throw Error("The object stored with the given key doesn't have type Object. Actual type: " + typeof actualObject);
        }
        
        storedObject.value = actualObject;
        setObject(key, storedObject, expiry);
        
    }
    
    function watchDog(){
        
        for (var i = 0; i<localStorage.length; i++) {
            var lsItem = localStorage.getItem(localStorage.key(i));
            var storedObject;
            try{
                 storedObject = JSON.parse(lsItem);
            } catch(err) {
                continue;
            }
            if(!storedObject) continue;
            
            if(storedObject.expiry && typeof storedObject.expiry === 'string') {
                var now = new Date();
                var expiry = new Date(storedObject.expiry)
                if(now > expiry) {
                    localStorage.removeItem(localStorage.key(i))
                }
            }
        }
        
        setTimeout(watchDog, storageCheckingTime*1000);
    }
    
    watchDog();
    
    window.getLocalStorageManager = function(){
        return managerObject;
    }
    
})();