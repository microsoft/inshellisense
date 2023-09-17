clac-widget() {
    clac "${(qqq)LBUFFER}"
    output=$(clac -o)
    eval "$output"
}

zle     -N   clac-widget
bindkey '^A' clac-widget