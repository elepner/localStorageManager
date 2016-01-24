


(function(){
    
    //Define class which handles triggering remove events by timeout.
    var ExpiryCounter = function(onExpireListener, secondsOrDateExpiry, key){
        this.removeFunction = function(){
            this.expired = true;
            if(this.expireListener) this.expireListener();
        }.bind(this);
        
        
        this.expireListener = onExpireListener;
        
        this.setExpiry(secondsOrDateExpiry);
        this.key = key;
    }

    ExpiryCounter.prototype.setExpiry = function(secondsOrDate){
        var now = new Date();
        var timeToLive = 0;
        if(secondsOrDate instanceof Date){
            timeToLive = Math.max(0, secondsOrDate.getTime() - now.getTime());
        } else {
            timeToLive = Math.max(0, secondsOrDate * 1000);
        }
        
        this.timeoutId = setTimeout(this.removeFunction, timeToLive);
        this.expiryDate = now.setSeconds(now.getSeconds() + timeToLive);
        this.expirySeconds = timeToLive;
        return timeToLive;
    }

    ExpiryCounter.prototype.updateTimer = function(secondsOrDateExpiry){
        if(this.expired) throw new Error("The object has already expired")
        clearTimeout(this.timeoutId);
        this.setExpiry(secondsOrDateExpiry);
    }

    ExpiryCounter.prototype.dispose = function(){
        this.expired = true;
        clearTimeout(this.timeoutId);
    }
    
    
    if(window.getLocalStorageManager){
        return;
    }
    
    var managerObject = {};
    var expiryCounters = {};
    function setObject(key, object, expiry){
        var expirationTime;
        if(expiry){
            var timeObject = new Date(); 
            var expirationTime = new Date(timeObject.getTime() + 1000*expiry); 
        }
        
        if(expiryCounters[key]){
            expiryCounters[key].updateTimer(expiry);
        } else {
            expiryCounters[key] = new ExpiryCounter(function(){
                managerObject.remove(key);
            }, expiry, key);
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
        return (JSON.parse(localStorage.getItem(key)) || {}).value;
    }
    
    managerObject.remove = function(key){
        localStorage.removeItem(key);
        if(expiryCounters[key]){
            expiryCounters[key].dispose();
            delete expiryCounters[key];
        }
            
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
    
    function fromJSON(key, stringValue){
        var lsObject;
        try{
            lsObject = JSON.parse(stringValue);
        } catch(err) {
            return null;
        }
        
        if(!lsObject) return null;
        
        if(lsObject.expiry && typeof lsObject.expiry === 'string') {
            var expiry = new Date(lsObject.expiry)
            return new ExpiryCounter(function(){
                managerObject.remove(key);
            }, expiry, key);
        }
    }
    
    //Init counters;
    Object.keys(localStorage).map(function(key){
        return {key: key, expiryCounter: fromJSON(key, localStorage.getItem(key))}
    }).filter(function(obj){
        return obj.expiryCounter!==null;
    }).forEach(function(obj){
       expiryCounters[obj.key] = obj.expiryCounter; 
    });
    
    window.getLocalStorageManager = function(){
        return managerObject;
    }
    
})();

