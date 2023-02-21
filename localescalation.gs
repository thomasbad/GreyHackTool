metaxploit = include_lib("/lib/metaxploit.so")
if not metaxploit then
	metaxploit = include_lib(current_path + "/metaxploit.so")
end if
if not metaxploit then exit("Error: Can't find metaxploit library in the /lib path or the current folder")

resultMem = ""
resultKey = ""

metaLib = metaxploit.load("/lib/net.so")
if metaLib then 
	print("Founded " + metaLib.lib_name + " "+ metaLib.version)
	exploits = metaxploit.scan(metaLib)
	for exploit in exploits
		print(exploit)
		result_lists = metaxploit.scan_address(metaLib, exploit).split("Unsafe check: ")[1:]
		for result_list in result_lists
			target_str = result_list.split(".")[0]
			target_key = target_str.split(" ")[-1]
			result = metaLib.overflow(exploit, target_key[3:-4])
			if typeof(result) == "shell" then
				root_file = result.host_computer.File("/root")
				if root_file.has_permission("w") then
					result.start_terminal
				else if root_file.has_permission("r") then
					resultMem = exploit
					resultKey = target_key[3:-4]
				else
					if resultMem == "" then resultMem = exploit
					if resultKey == "" then resultKey = target_key[3:-4]
				end if
			end if
		end for
	end for
end if

metaLib = []
metaLib = metaxploit.load("/lib/init.so")
if not metaLib then exit("Can't find " + "/lib/init.so")

print("Founded " + metaLib.lib_name + " "+ metaLib.version)

if metaLib then 
	exploits = metaxploit.scan(metaLib)
	for exploit in exploits
		print(exploit)
		result_lists = metaxploit.scan_address(metaLib, exploit).split("Unsafe check: ")[1:]
		for result_list in result_lists
			target_str = result_list.split(".")[0]
			target_key = target_str.split(" ")[-1]
			result = metaLib.overflow(exploit, target_key[3:-4])
			if typeof(result) == "shell" then
				root_file = result.host_computer.File("/root")
				if root_file.has_permission("w") then
					result.start_terminal
				else if root_file.has_permission("r") then
					resultMem = kernel_router_exploit
					resultKey = target_key[3:-4]
				else
					if resultMem == "" then resultMem = exploit
					if resultKey == "" then resultKey = target_key[3:-4]
				end if
			end if
		end for
	end for
end if
result = metaLib.overflow(resultMem, resultKey)
if typeof(result) == "shell" then
	result.start_terminal
end if
exit("Fail...")
