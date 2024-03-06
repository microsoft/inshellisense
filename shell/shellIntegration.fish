function __is_copy_function; functions $argv[1] | sed "s/^function $argv[1]/function $argv[2]/" | source; end
function __is_prompt_start; printf '\e]6973;PS\a'; end
function __is_prompt_end; printf '\e]6973;PE\a'; end

function __is_escape_value
	echo $argv \
	| string replace --all '\\' '\\\\' \
	| string replace --all ';' '\\x3b' \
	;
end
function __is_update_cwd --on-event fish_prompt; set __is_cwd (__is_escape_value "$PWD"); printf "\e]6973;CWD;$__is_cwd\a"; end

__is_copy_function fish_prompt is_user_prompt

if [ "$ISTERM_TESTING" = "1" ]
	function is_user_prompt; printf '> '; end
end

function fish_prompt; printf (__is_prompt_start); printf (is_user_prompt); printf (__is_prompt_end); end