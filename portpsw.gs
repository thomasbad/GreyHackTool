if params.len != 2 or params[0] == "-h" or params[0] == "--help" then exit("<b>Usage: "+program_path.split("/")[-1]+" [ip_address] [port]</b>")
metaxploit = include_lib("/lib/metaxploit.so")
if not metaxploit then
	metaxploit = include_lib(current_path + "/metaxploit.so")
end if
if not metaxploit then exit("Error: Can't find metaxploit library in the /lib path or the current folder")

cryptools = include_lib("/lib/crypto.so")
if not cryptools then
	cryptools = include_lib(current_path + "/crypto.so")
end if
if not cryptools then exit("Error: Can't find crypto.so library in the /lib path or the current folder")

Flag_Bank_Mail = 0
Flag_User_Key = 0
Flag_User_Ask_Key = 0
Bank_Key = 0
Mail_Key = 0
User_Key = 0

GetPassword = function(userPass)
	if userPass.len != 2 then return
	password = cryptools.decipher(userPass[1])
	return password
end function

AccessPasswdFile = function(result)
	print("Accesing to password file...")
	files = result.get_files
	for file in files
		if file.name == "passwd" then
			if not file.has_permission("r") then 
				Flag_User_Key = 0
				return 
			end if 
			listUsers = file.get_content.split("\n")
			for line in listUsers
				userPass = line.split(":")
				password = GetPassword(userPass)
				if not password then 
					print("Nothing found...")
				else
					print("=>Deciphering user <b>" + userPass[0] + "</b> : <b>" + password + "</b>")
				end if
			end for
			globals.Flag_User_Key = 1
			if globals.Flag_Bank_Mail == 1 and globals.Flag_User_Key == 1 then exit("Done...")
		end if
	end for
	print("Error: /etc/passwd file not found. Program aborted");
end function

bankFound = false
mailFound = false

AccessHomeFile = function(homeFolder)
	print("Accesing to Mail.txt files...\nSearching users...")
	folders = homeFolder.get_folders
	for user in folders
		print("User: " + user.name +" found...")
		subFolders = user.get_folders

		for subFolder in subFolders
			if subFolder.name == "Config" then
				files = subFolder.get_files
				for file in files
					if file.name == "Bank.txt" then
						globals.Flag_Bank_Mail = 1
						if not file.has_permission("r") then print("failed. Can't access to file contents. Permission denied")
						if typeof(globals.Bank_Key) != "string" then globals.Bank_Key = user_input("Read Bank Password? [Y/N]\n")
						if globals.Bank_Key == "Y" or globals.Bank_Key == "y" or globals.Bank_Key == "Yes" or globals.Bank_Key == "yes" then
							listUsers = file.get_content.split("\n")
							for line in listUsers
								userPass = line.split(":")
								password = GetPassword(userPass)
								if not password then 
									print("Nothing found...")
								else
									print("=> Deciphering user <b>" + userPass[0] + "</b> : <b>" + password + "</b>")
								end if
							end for
						end if
						globals.bankFound = true
					else if file.name == "Mail.txt" then
						globals.Flag_Bank_Mail = 1
						if not file.has_permission("r") then print("failed. Can't access to file contents. Permission denied")
						if typeof(globals.Mail_Key) != "string" then globals.Mail_Key = user_input("Read Mail Password? [Y/N]\n")
						if globals.Mail_Key == "Y" or globals.Mail_Key == "y" or globals.Mail_Key == "Yes" or globals.Mail_Key == "yes" then
							listUsers = file.get_content.split("\n")
							for line in listUsers
								userPass = line.split(":")
								password = GetPassword(userPass)
								if not password then 
									print("Nothing found...")
								else
									print("=> Deciphering user <b>" + userPass[0] + "</b> : <b>" + password + "</b>")
								end if
							end for
						end if
						globals.mailFound = true
					end if
				end for
			end if
		end for
	end for
	if not globals.mailFound then print("Mail file not found.")
	if not globals.bankFound then print("Bank file not found.")
	if folders.len == 0 then print("No users found. Program aborted")
end function

address = params[0]
port = params[1].to_int

net_session = metaxploit.net_use( address, port )
if not net_session then exit("Error: can't connect to net session")
metaLib = net_session.dump_lib

print("Founded " + metaLib.lib_name + " "+ metaLib.version)

if not metaLib then exit("Error: TargetLib not found.")

exploits = metaxploit.scan(metaLib)
for exploit in exploits
	print(exploit)
	result_lists = metaxploit.scan_address(metaLib, exploit).split("Unsafe check: ")[1:]
	for result_list in result_lists
		target_str = result_list.split(".")[0]
		target_key = target_str.split(" ")[-1]
		result = metaLib.overflow(exploit, target_key[3:-4])
		
		if(typeof(result) == "computer") then
			if Flag_Bank_Mail == 0 then
				homeFolder = result.File("/home")
				if not homeFolder then 
					print("Error: /home folder not found")
				else
					userFolders = homeFolder.get_folders
					founded_bank = false
					founded_mail = false
					
					Bank_Key = user_input("Read Banks Password? [Y/N]\n")
					
					if Bank_Key == "Y" or Bank_Key == "y" or Bank_Key == "Yes" or Bank_Key == "yes" then
						for userFolder in userFolders
							bankFile = result.File("/home/" + userFolder.name + "/Config/Bank.txt")
							if not bankFile then continue
							if not bankFile.has_permission("r") then 
								print("Error: can't read file contents. Permission deniend")
								break
							end if
							userPass = bankFile.get_content.split(":")
							print("Deciphering bank password for user: " + userFolder.name)
							password = GetPassword(userPass)
							if not password then 
								print("Nothing found...")
							else
								print("Bank account: <b>" + userPass[0] +"</b>\nBank Password: <b>" + password + "</b>")
								founded_bank = true
							end if
						end for
					else
						founded_bank = true
					end if
					
					Mail_Key = user_input("Read Mails Password? [Y/N]\n")
					
					if Mail_Key == "Y" or Mail_Key == "y" or Mail_Key == "Yes" or Mail_Key == "yes" then
						for userFolder in userFolders
							mailFile = result.File("/home/" + userFolder.name + "/Config/Mail.txt")
							if not mailFile then continue
							if not mailFile.has_permission("r") then 
								print("Error: can't read file contents. Permission deniend")
								break
							end if
							userPass = mailFile.get_content.split(":")
							print("Deciphering mail password for user: " + userFolder.name)
							password = GetPassword(userPass)
							if not password then 
								print("Nothing found...")
							else
								print("Mail account: <b>" + userPass[0] +"</b>\nMail Password: <b>" + password + "</b>")
								founded_mail = true
							end if
						end for
					else
						founded_mail = true
					end if
					
					if founded_bank and founded_mail then 
						Flag_Bank_Mail = 1
					end if
				end if
				if Flag_User_Key == 0 then 
					if Flag_User_Ask_Key == 0 then
						User_Key = user_input("Read User Password? [Y/N]\n")
						Flag_User_Ask_Key = 1		
					end if 	
					if User_Key == "Y" or User_Key == "y" or User_Key == "Yes" or User_Key == "yes" then
						file = result.File("/etc/passwd")
						if not file then exit("Error: file /etc/passwd not found")
						if not file.has_permission("r") then continue 
						if file.is_binary then exit("Error: invalid /etc/passwd file found.")
						Flag_User_Key = 1
						listUsers = file.get_content.split("\n")
						for line in listUsers
							userPass = line.split(":")
							password = GetPassword(userPass)
							if not password then 
								print("Nothing found...")
							else
								print("=> Deciphering user <b>" + userPass[0] + "</b> : <b>" + password + "</b>")
							end if
						end for
					else
						Flag_User_Key = 1
					end if
				end if
				if Flag_Bank_Mail == 1 and Flag_User_Key == 1 then exit("Done...")
			end if
		end if
	end for
end for	

for exploit in exploits
	print(exploit)
	result_lists = metaxploit.scan_address(metaLib, exploit).split("Unsafe check: ")[1:]
	if Flag_User_Key == 0 then 
		for result_list in result_lists
			target_str = result_list.split(".")[0]
			target_key = target_str.split(" ")[-1]
			result = metaLib.overflow(exploit, target_key[3:-4])
			if (typeof(result) == "file") then
				print("Obtained access to " + result.path)
				if Flag_Bank_Mail != 1 then 
					if typeof(Bank_Key) != "string" and typeof(Mail_Key) != "string" then 
						if result.path == "/home" then
							AccessHomeFile(result)
						else
							print("Searching home folder...")
							while not result.path == "/"
								result = result.parent
							end while
							folders = result.get_folders
							for folder in folders
								if folder.path == "/home" then
									AccessHomeFile(folder)
								end if
							end for
						end if
					end if
				end if	
				if typeof(User_Key) != "string" then User_Key = user_input("Read User Password? [Y/N]\n")
				if User_Key == "Y" or User_Key == "y" or User_Key == "Yes" or User_Key == "yes" then
					if Flag_User_Key != 1 then 
						if result.path == "/etc" then
							AccessPasswdFile(result)
						else 
							print("Attempting to reach /etc folder...")
							while result.path != "/"
								result = result.parent
							end while
							folders = result.get_folders
							for folder in folders
								if folder.path == "/etc" then
									AccessPasswdFile(folder)
								end if
							end for
						end if  
					end if 
				end if
			end if
		end for 
	end if
end for

exit("Fail...")

