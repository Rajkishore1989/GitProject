code = []
scanactive = false
#docRoutes = 
#	PL: '/courts.net.ws/home/test/%'

#captureRedirect = () ->
#	docType = code.substring(1, 2)
#	route = docRoutes[docType]
#	if route? then stateMachine.UpdateState(replace('%', code)) else alert("Barcode not recognized")

	
$(window).keydown ->	
	EndCaptureCode = 13
	StartCaptureCode = 13

	if  event.keyCode == EndCaptureCode and not $('.scanning').length
		StateMachine.updateState(code)
		scanactive = false
	if event.keyCode == StartCaptureCode and not $('.scanning').length
		scanactive = true
		window.setTimeout(scanactive = false, 1000)
		code = []
		active = true
	if scanactive
		code.push(event.keyCode)