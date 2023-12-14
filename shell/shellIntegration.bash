if [ -r ~/.bashrc ]; then
    . ~/.bashrc
fi
if [ -r /etc/profile ]; then
    . /etc/profile
fi
if [ -r ~/.bash_profile ]; then
    . ~/.bash_profile
elif [ -r ~/.bash_login ]; then
    . ~/.bash_login
elif [ -r ~/.profile ]; then
    . ~/.profile
fi

if [ -r ~/.inshellisense/bash-preexec.sh ]; then
    . ~/.inshellisense/bash-preexec.sh
fi

__is_prompt_start() {
	builtin printf '\e]6973;PS\a'
}

__is_prompt_end() {
	builtin printf '\e]6973;PE\a'
}

__is_escape_value() {
	# Process text byte by byte, not by codepoint.
	builtin local LC_ALL=C str="${1}" i byte token out=''

	for (( i=0; i < "${#str}"; ++i )); do
		byte="${str:$i:1}"

		# Escape backslashes and semi-colons
		if [ "$byte" = "\\" ]; then
			token="\\\\"
		elif [ "$byte" = ";" ]; then
			token="\\x3b"
		else
			token="$byte"
		fi

		out+="$token"
	done

	builtin printf '%s\n' "${out}"
}

__is_update_cwd() {
	builtin printf '\e]6973;CWD;%s\a' "$(__is_escape_value "$PWD")"
}

if [[ -n "${bash_preexec_imported:-}" ]]; then
    precmd_functions+=(__is_update_cwd)
fi

__is_update_prompt() {
	if [[ "$__is_custom_PS1" == "" || "$__is_custom_PS1" != "$PS1" ]]; then
        __is_original_PS1=$PS1
        __is_custom_PS1="\[$(__is_prompt_start)\]$__is_original_PS1\[$(__is_prompt_end)\]"
        export PS1="$__is_custom_PS1"
    fi
}

__is_update_prompt