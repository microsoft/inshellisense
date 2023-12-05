if [[ -f $USER_ZDOTDIR/.zlogin ]]; then
	ZDOTDIR=$USER_ZDOTDIR
	. $ZDOTDIR/.zlogin
fi
