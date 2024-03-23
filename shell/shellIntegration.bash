if [ -r ~/.bashrc ]; then
    . ~/.bashrc
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
    precmd_functions+=(__is_precmd)
fi

__is_precmd() {
	__is_update_cwd
	__is_update_prompt
}

__is_update_prompt() {
	if [[ "$__is_custom_PS1" == "" || "$__is_custom_PS1" != "$PS1" ]]; then
        __is_original_PS1=$PS1
		if [[ $ISTERM_TESTING == "1" ]]; then
			__is_original_PS1="> "
		fi
        __is_custom_PS1="\[$(__is_prompt_start)\]$__is_original_PS1\[$(__is_prompt_end)\]"
        PS1="$__is_custom_PS1"
    fi
}

__is_prompt_cmd_original() {
	for cmd in "${__is_original_prompt_command[@]}"; do
		eval "${cmd:-}"
	done
	__is_precmd
}

# handles when a user's PROMPT_COMMAND resets their prompt after the precmd hook is triggered
__is_prompt_cmd_safe() {
	for cmd in "${__is_original_prompt_command[@]}"; do
		eval "${cmd:-}"
	done
	if [[ "$PS1" != "$__is_safe_PS1" ]]; then 
		__is_precmd
		__is_safe_PS1="$PS1"
	fi
}

__is_original_prompt_command=${PROMPT_COMMAND:-}
if [[ -z "${bash_preexec_imported:-}" ]]; then
	if [[ -n "${__is_original_prompt_command:-}" && "${__is_original_prompt_command:-}" != "__is_precmd" ]]; then
		PROMPT_COMMAND=__is_prompt_cmd_original
	else
		PROMPT_COMMAND=__is_precmd
	fi
else
	if [[ -n "${__is_original_prompt_command:-}" && "${__is_original_prompt_command:-}" != "__is_precmd" ]]; then 
		PROMPT_COMMAND=__is_prompt_cmd_safe
	fi
fi

__is_precmd