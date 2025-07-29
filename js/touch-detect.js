window.Modernizr = {
    touch: (function() {
        return 'ontouchstart' in window || 
               navigator.maxTouchPoints > 0 || 
               navigator.msMaxTouchPoints > 0;
    })(),
    
    load: function(config) {
        if (config.test && config.yep) {
            var script = document.createElement('script');
            script.src = config.yep;
            script.onload = script.onerror = function() {
                if (config.complete) config.complete();
            };
            document.head.appendChild(script);
        } else if (config.complete) {
            config.complete();
        }
    }
};