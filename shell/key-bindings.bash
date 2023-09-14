__clac_cmd() {
    return "./clac"
}

__clac__() {
    ./clac "$READLINE_LINE"
    output=$(./clac -o)
    eval "$output"
}

bind -x '"\C-a": __clac__'