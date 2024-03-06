if [[ -f $USER_ZDOTDIR/.zshrc ]]; then
	ZDOTDIR=$USER_ZDOTDIR
	. $USER_ZDOTDIR/.zshrc
fi

__is_prompt_start() {
	builtin printf '\e]6973;PS\a'
}

__is_prompt_end() {
	builtin printf '\e]6973;PE\a'
}

__is_escape_value() {
	builtin emulate -L zsh

	# Process text byte by byte, not by codepoint.
	builtin local LC_ALL=C str="$1" i byte token out=''

	for (( i = 0; i < ${#str}; ++i )); do
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

	builtin print -r "$out"
}

__is_update_cwd() {
	builtin printf '\e]6973;CWD;%s\a' "$(__is_escape_value "${PWD}")"
}

__is_update_prompt() {
	__is_prior_prompt="$PS1"
	if [[ $ISTERM_TESTING == "1" ]]; then
		__is_prior_prompt="> "
	fi
	PS1="%{$(__is_prompt_start)%}$__is_prior_prompt%{$(__is_prompt_end)%}"
}

__is_precmd() {
	if [[ $PS1 != *"$(__is_prompt_start)"* ]]; then
		__is_update_prompt
	fi
	__is_update_cwd
}

__is_update_prompt
add-zsh-hook precmd __is_precmd