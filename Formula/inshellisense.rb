class Inshellisense < Formula
  desc "IDE style command line auto complete"
  homepage "https://github.com/microsoft/inshellisense"
  url "https://registry.npmjs.org/@microsoft/inshellisense/-/inshellisense-0.0.1-rc.30.tgz"
  sha256 "7af995f84dfae895ac4a045dc10ac8d5883dcbb3136aa7f279a2ed15ca02e724"
  license "MIT"

  depends_on "node"

  def install
    system "npm", "install", *std_npm_args
    bin.install_symlink libexec.glob("bin/*")
  end

  test do
    system bin/"inshellisense", "--version"
  end
end
	