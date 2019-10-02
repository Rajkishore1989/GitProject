class StateMachine 
	currentstate: ''

	constructor: (@baseUrl) ->
		currentstate = changestate(directing,'')
						
	docRoutes:  
		PL: '/courts.net.ws/home/test/%'
		DL: '/courts.net.ws/home/test/%'
		LP: '/courts.net.ws'

	#States
	directing: () -> 
	reading: () ->

	changestate: (newstate,code) ->
		newstate
	
	request: (code) -> 
		if currentstate == directing
			docType = code.substring(1, 2)
			route = docRoutes[docType]
			if route? 
				changestate('directing',replace('%', code)) 
			else 
				alert("Barcode not recognized")				
