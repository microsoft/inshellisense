if [[ -f $USER_ZDOTDIR/.zshenv ]]; then
	ZDOTDIR=$USER_ZDOTDIR

	# prevent recursion
	if [[ $USER_ZDOTDIR != $ZDOTDIR ]]; then
		ZDOTDIR=$USER_ZDOTDIR
		. $USER_ZDOTDIR/.zshenv
	fi
fi
