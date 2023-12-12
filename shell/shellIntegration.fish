function __is_copy_function; functions $argv[1] | sed "s/^function $argv[1]/function $argv[2]/" | source; end
function __is_prompt_start; printf '\e]6973;PS\a'; end
function __is_prompt_end; printf '\e]6973;PE\a'; end

__is_copy_function fish_prompt is_user_prompt
function fish_prompt; printf (__is_prompt_start); printf (is_user_prompt); printf (__is_prompt_end); end