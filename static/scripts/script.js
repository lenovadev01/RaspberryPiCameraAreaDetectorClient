var raspicamviewerApp = angular.module('raspicamviewer', []);
var imageMode;
var acquire = 0;

/**
 * Controller for the settings
 * @param  $rootScope App root scope
 * @param  $scope     Controller scope
 * @param  $http      Object for http communication
 * @param  $interval  Object for periodic function calling
 */
raspicamviewerApp.controller('SettingCtrl', function ($rootScope, $scope, $http, $interval) {
    // These fields are shown as settings to the user
    $rootScope.integerFields = [
        {name: "inputBrightness",           title: "Brightness",                record: "RASPICAM1:cam1:BRIGHTNESS",           min: 0, max: 100, value: 50, step: 1, disabled: "false"},
        {name: "inputSharpness",            title: "Sharpness",                 record: "RASPICAM1:cam1:SHARPNESS",            min: -100, max: 100, value: 0, step: 1, disabled: "false"},
        {name: "inputContrast",             title: "Contrast",                  record: "RASPICAM1:cam1:CONTRAST",             min: -100, max: 100, value: 0, step: 1, disabled: "false"},
        {name: "inputISO",                  title: "ISO",                       record: "RASPICAM1:cam1:ISO",                  min: 0, max: 4000, value: 400, step: 1, disabled: "false"},
        {name: "inputSaturation",           title: "Saturation",                record: "RASPICAM1:cam1:SATURATION",           min: -100, max: 100, value: 50, step: 1, disabled: "false"},
        {name: "inputExposureCompensation", title: "Exposure Compensation",     record: "RASPICAM1:cam1:EXPOSURECOMPENSATION", min: -10, max: 10, value: 0, step: 1, disabled: "false"},
        {name: "inputRotation",             title: "Rotation",                  record: "RASPICAM1:cam1:ROTATION",             min: -360, max: 360, value: 0, step: 90, disabled: "false"},
        {name: "inputShutterSpeed",         title: "Shutter Speed",             record: "RASPICAM1:cam1:SHUTTERSPEED",         min: 0, max: 330000, value: 0, step: 1, disabled: "false"},
        {name: "inputAWB_R",                title: "Auto white balance - Red",  record: "RASPICAM1:cam1:AWB_R",                min: 0, max: 100, value: 0, step: 0.1, disabled: "false"},
        {name: "inputAWB_B",                title: "Auto white balance - Blue", record: "RASPICAM1:cam1:AWB_B",                min: 0, max: 100, value: 0, step: 0.1, disabled: "false"}
    ];

    $rootScope.booleanFields = [
        {name: "inputVideoStabilization", title: "Video stabilization", record: "RASPICAM1:cam1:VIDEOSTABILIZATION", value: 0, disabled: "false"},
        {name: "inputHorizontalFlip", title: "Horizontal Flip", record: "RASPICAM1:cam1:HORIZONTALFLIP", value: 0, disabled: "false"},
        {name: "inputVerticalFlip", title: "Vertical Flip", record: "RASPICAM1:cam1:VERTICALFLIP", value: 0, disabled: "false"}
    ];

    $rootScope.enumFields = {
        inputResolution: {name: "inputResolution", title: "Resolution", record: "RASPICAM1:cam1:RESOLUTION", value: "0", 
            options: {
                0: "1280x960",
                1: "640x480",
                2: "320x240"
            },
            // disable changing the resolution while the camera is open
            disabled: "cameraState"
        },
        inputImageMode: {name: "inputImageMode", title: "Image mode", record: "RASPICAM1:cam1:ImageMode", value: "0", 
            options: {
                0: "Single",
                2: "Continuous"
            },
            disabled: "false"
        },
        inputColorMode: {name: "inputColorMode", title: "Color mode", record: "RASPICAM1:cam1:ColorMode", value: "3", 
            options: {
                0: "Format YUV420",
                1: "Format GRAY",
                2: "Format BGR",
                3: "Format RGB"
            },
            // disable changing the color mode while the camera is open
            disabled: "cameraState"
        },
        inputAWB: {name: "inputAWB", title: "Auto white balance", record: "RASPICAM1:cam1:AWB", value: "1", 
            options: {
                0: "Off",
                1: "Auto",
                2: "Sunlight",
                3: "Cloudy",
                4: "Shade",
                5: "Tungsten",
                6: "Fluorescent",
                7: "Incandescent",
                8: "Flash",
                9: "Horizon"
            },
            disabled: "false"
        },
        inputExposure: {name: "inputExposure", title: "Exposure", record: "RASPICAM1:cam1:EXPOSURE", value: "0", 
            options: {
                0: "Auto",
                1: "Night",
                2: "Nightpreview",
                3: "Backlight",
                4: "Spotlight",
                5: "Sports",
                6: "Snow",
                7: "Beach",
                8: "Verylong",
                9: "Fixedfps",
                10: "Antishake",
                11: "Fireworks"
            },
            disabled: "false"
        },
        inputImageEffect: {name: "inputImageEffect", title: "Image Effect", record: "RASPICAM1:cam1:IMAGEEFFECT", value: "0", 
            options: {
                0: "None",
                1: "Negative",
                2: "Solarize",
                3: "Sketch",
                4: "Denoise",
                5: "Emboss",
                6: "Oilpaint",
                7: "Hatch",
                8: "Gpen",
                9: "Pastel",
                10: "Watercolor",
                11: "Film",
                12: "Blur",
                13: "Saturation",
                14: "Colorswap",
                15: "Washedout"
            },
            disabled: "false"
        },
        inputMetering: {name:"inputMetering", title: "Metering", record: "RASPICAM1:cam1:METERING", value: "0", 
            options: {
                0: "Average",
                1: "Spot",
                2: "Backlit",
                3: "Matrix"
            },
            disabled: "false"
        }
    };

    // is the camera open (1) or closed (0)
    $rootScope.cameraState = 0;

    /**
     * When a setting is changes, update the EPICS record
     * @param  {[type]} row [description]
     * @return {[type]}     [description]
     */
    $scope.updateSetting = function(row){
        // send data with ajax
        $http.get("/caput/" + row.record + "/" + row.value + "/").success(function(data){
            // done
        });
    }

    /**
     * When the page is ready, load all the settings
     */
    angular.element(document).ready(function () {
        $scope.getAllSettings();
    });

    /**
     * Load all setting from the IOC.
     * @return {[type]} [description]
     */
    $scope.getAllSettings = function() {
        console.log("Loading settings");
        // also load camera open state
        var recordList = ["RASPICAM1:cam1:CAMERAOPEN_RBV"];
        // get names of all the records we are insterested in
        
        angular.forEach($rootScope.integerFields, function(value, key) {
            recordList.push(value.record);
        });
        angular.forEach($rootScope.booleanFields, function(value, key) {
            recordList.push(value.record);
        });
        angular.forEach($rootScope.enumFields, function(value, key) {
            recordList.push(value.record);
        });

        // send request with record names in a json
        $http.post('/info/', recordList).success(function(data, status, headers, config) {
            // response json is now in data
            // go through all the records and update the values
            
            angular.forEach($rootScope.integerFields, function(value, key) {
                value.value = data[value.record];
            });
            angular.forEach($rootScope.booleanFields, function(value, key) {
                value.value = data[value.record];
            });
            angular.forEach($rootScope.enumFields, function(value, key) {
                value.value = data[value.record].toString();
            });

            // also update camera state
            $rootScope.cameraState = data["RASPICAM1:cam1:CAMERAOPEN_RBV"];

            // reload image
            $rootScope.reloadImage();
        });
    };
 
    /**
     * Event to refresh camera state
     */
    $rootScope.$on('refreshCameraOpenState', function(event, args) {
        $http.post('/info/', ["RASPICAM1:cam1:CAMERAOPEN_RBV"]).success(function(data, status, headers, config) {
            $rootScope.cameraState = data["RASPICAM1:cam1:CAMERAOPEN_RBV"];

            if($rootScope.cameraState == "1"){
                // camera is open, refresh image
                $rootScope.reloadImage();
            }
        });
    });

    /**
     * Constantly poll for new camera state data
     */
    var stopInterval = $interval(function(){
        $rootScope.$emit('refreshCameraOpenState');
    }, 2000);
});

/**
 * Controller for changing the picture and sending the acquire/stop requests.
 * @param  $rootScope App root scope
 * @param  $scope     Controller scope
 * @param  $http      Object for http communication
 */
raspicamviewerApp.controller('PhotoCtrl', function ($rootScope, $scope, $http) {
    // this is the static image URL
	$scope.staticImageUrl = "/image";
    // to reload the image a timestamp is appended to the end
	$scope.imageUrl = $scope.staticImageUrl;

    // Timestamp in string
    $scope.timestamp = new Date().toString();

    /**
     * Called when acquire button is pressed. Sends acquire request.
     * When the request returns, the image is reloaded.
     */
	$scope.acquirePhoto = function(){
		// refresh camera state
        $rootScope.$emit('refreshCameraOpenState');

        // send acquire request
		$http.get("/acquire/").success(function(data){
            $rootScope.reloadImage();
            $rootScope.$emit('refreshCameraOpenState');
        });
	};

    /**
     * Called when the stop button is pressed.
     */
    $scope.stopContinuous = function(){
        // send stop
        $http.get("/caput/RASPICAM1:cam1:Acquire/0/").success(function(data){
            // refresh camera open state
            $rootScope.$emit('refreshCameraOpenState');
        });
    };

    /**
     * This function reloads the image.
     */
	$rootScope.reloadImage = function(){
        var currentTime = new Date();
		// reload image
		$scope.imageUrl = $scope.staticImageUrl + '#' + currentTime.getTime();

        // set new timestamp
        $scope.timestamp = currentTime.toString();
	}

    /**
     * Called when the image finishes loading. 
     * If we are in continuous mode and the camera is open, refresh the image again.
     */
    $scope.imageLoaded = function(){
        console.log("Image loaded with " + $rootScope.enumFields.inputImageMode.value + " and " + $rootScope.cameraState);
        // check if continuous and camera open
        if($rootScope.enumFields.inputImageMode.value == 2 && $rootScope.cameraState != 0){
            console.log("Reloading again");

            // refresh camera state and reload image
            $rootScope.$emit('refreshCameraOpenState');
            $rootScope.reloadImage();
        }
    }
});

/**
 * An AngularJS directive, which adds an argument. The function specified in the argument
 * is called when the object finishes loading.
 * In this case it is used to detect when the image has loaded.
 */
raspicamviewerApp.directive('imageonload', function() {
        return {
            // restrict this directive to only be used as an argument
            restrict: 'A',
            link: function(scope, element, attrs) {
                element.bind('load', function() {
                    // call the function that was passed
                    scope.$apply(attrs.imageonload);
                });
            }
        };
    })