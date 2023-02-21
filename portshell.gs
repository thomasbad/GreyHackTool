if params.len != 2 or params[0] == "-h" or params[0] == "--help" then exit("<b>Usage: "+program_path.split("/")[-1]+" [ip_address] [port]</b>")
metaxploit = include_lib("/lib/metaxploit.so")
if not metaxploit then
	metaxploit = include_lib(current_path + "/metaxploit.so")
end if
if not metaxploit then exit("Error: Can't find metaxploit library in the /lib path or the current folder")
address = params[0]
port = params[1].to_int

net_session = metaxploit.net_use( address, port )
if not net_session then exit("Error: can't connect to net session")
metaLib = net_session.dump_lib

print("Founded " + metaLib.lib_name + " " + metaLib.version)

if not metaLib then exit("Error: TargetLib not found.")

resultMem = ""
resultKey = ""

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
result = metaLib.overflow(resultMem, resultKey)
if typeof(result) == "shell" then
    result.start_terminal
end if
exit("Fail...")
