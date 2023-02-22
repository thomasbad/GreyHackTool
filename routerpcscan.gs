if params.len != 2 or params[0] == "-h" or params[0] == "--help" then exit("<b>Usage: "+program_path.split("/")[-1]+" [ip_address] [LAN_address]</b>")
metaxploit = include_lib("/lib/metaxploit.so")
if not metaxploit then
	metaxploit = include_lib(current_path + "/metaxploit.so")
end if
if not metaxploit then exit("Error: Can't find metaxploit library in the /lib path or the current folder")

address = params[0]
net_session = metaxploit.net_use( address )
if not net_session then exit("Error: can't connect to net session")
libKernel = net_session.dump_lib

print("\nFounded " + libKernel.lib_name + " "+ libKernel.version)

if not libKernel then exit("Error: " + libName + " not found.")

lanIp = params[1]

kernel_router_exploits = metaxploit.scan(libKernel)

lanIp = lanIp.split(".")
Head = lanIp[0]+"."+lanIp[1]+"."+lanIp[2]+"."
End = lanIp[-1].to_int

GetKeyword = function()
	for kernel_router_exploit in kernel_router_exploits
		result_lists = metaxploit.scan_address(libKernel, kernel_router_exploit).split("Unsafe check: ")[1:]
		for result_list in result_lists
			target_str = result_list.split(".")[0]
			target_key = target_str.split(" ")[-1]
			for _ in range(1, 255, 1)
				if _ != End then
					result = libKernel.overflow(kernel_router_exploit, target_key[3:-4], Head + str(_))
					if typeof(result) == "computer" then
						return [kernel_router_exploit, target_key[3:-4]]
					else if typeof(result) != "null" and typeof(result) != "computer" then
						break
					end if
				end if
			end for
			if typeof(result) != "null" and typeof(result) != "computer" then continue
		end for
	end for
end function

Key = GetKeyword()

Output = ""

for _ in range(1, 255, 1)
	if _ != End then
		result = libKernel.overflow(Key[0], Key[1], Head + str(_))
		if typeof(result) == "computer" then
			Output = Output + Head + str(_) + "\n"
		end if
	end if
end for 
clear_screen
if Output == "" then 
	exit("<b>Fail...</b>")
else
	print("<b>Found Computers: </b>\n")
	print(Output)
end if
