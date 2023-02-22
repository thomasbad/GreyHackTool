if params.len != 1 or params[0] == "-h" or params[0] == "--help" then exit(command_info("<b>probe [IP]</b>"))	
if not is_valid_ip(params[0]) then exit("probe: invalid ip address")
if not get_shell.host_computer.is_network_active then exit("probe: can't connect. No internet access.")

router = get_router(params[0])
ports = router.used_ports
devices = router.devices_lan_ip
print("\n<b>PORTS:</b>")
info = "PORT STATE SERVICE VERSION LAN"
for port in ports
	other_ip = port.get_lan_ip
	port_status = "Open"
	if port.is_closed then
		port_status = "Closed"
	end if
	info = info + "\n" + port.port_number + " " + port_status + " " + router.port_info(port) + " " + other_ip
end for
print(format_columns(info))
print("\n<b>DEVICES:</b>")
info = "DEVICE LAN STATE PORTS"
COMPUTERS = ""
ROUTERS = ""
SWITCHS = ""

for device in devices
	DP = router.device_ports(device)
	port_list = []
	for P in DP
		if typeof(P) != "port" then 
			port_list = "Unreachable"
			break
		end if
		port_list = port_list + [P.port_number]
	end for
	port_list_str = "["
	for port in port_list
		port_list_str = port_list_str + str(port) + ","
	end for
	if(port_list_str == "[") then 
		port_list_str = "[]"
	else
		port_list_str = port_list_str[:-1] + "]"
	end if
	new_router = get_router(device)
	new_switch = get_switch(device)
	if new_router != null then
		STATE = new_router.firewall_rules
		if STATE == [] then
			STATE = "None"
		else
			STATE = STATE[0].split(" ")[0]
		end if
		if new_switch != null then
			SWITCHS = SWITCHS + "SWITCH " + device + " " + STATE + " " + port_list_str + "\n"
		else
			ROUTERS = ROUTERS  + "ROUTER " + device + " " + STATE + " " + port_list_str + "\n"
		end if
	end if
	if new_switch == null and new_router == null then
		if port_list != [] and port_list[0] == 8080 then
			if device == router.local_ip then
				STATE = router.firewall_rules
				if STATE == [] then STATE = "None"
			else
				STATE = "Unknown"
			end if
			ROUTERS = ROUTERS  + "ROUTER " + device + " " + STATE + " " + port_list_str + "\n"
		else
			COMPUTERS = COMPUTERS + "COMPUTER " + device + " " + "Null" + " " + port_list_str + "\n"
		end if
	end if
end for
info = info + "\n" + COMPUTERS + "\n" + ROUTERS + "\n" + SWITCHS
print(format_columns(info))
