__is_login_home=$HOME
HOME=$ISTERM_USER_HOME
export HOME
unset ISTERM_USER_HOME

if [ -r ~/.bash_profile ]; then
	. ~/.bash_profile
elif [ -r ~/.bash_login ]; then
	. ~/.bash_login
elif [ -r ~/.profile ]; then
	. ~/.profile
fi

ISTERM_LOGIN=1
. "$__is_login_home/shellIntegration.bash"
unset __is_login_home
