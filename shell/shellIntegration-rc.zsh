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

__is_update_prompt() {
	__is_prior_prompt="$PS1"
	PS1="%{$(__is_prompt_start)%}$PS1%{$(__is_prompt_end)%}"
}

__is_update_prompt