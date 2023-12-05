__is_prompt_start() {
	builtin printf '\e]6973;PS\a'
}

__is_prompt_end() {
	builtin printf '\e]6973;PE\a'
}

__is_update_prompt() {
	if [[ "$__is_custom_PS1" == "" || "$__is_custom_PS1" != "$PS1" ]]; then
        __is_original_PS1=$PS1
        __is_custom_PS1="\[$(__is_prompt_start)\]$__is_original_PS1\[$(__is_prompt_end)\]"
        PS1="$__is_custom_PS1"
    fi
}

__is_update_prompt