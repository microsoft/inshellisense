class Inshellisense < Formula
  desc "IDE style command line auto complete"
  homepage "https://github.com/microsoft/inshellisense"
  url "https://registry.npmjs.org/@microsoft/inshellisense/-/inshellisense-0.0.1-rc.28.tgz"
  sha256 "a509118c42bf3de1fa49680620e500d6dccffa02d033afa869b4816bf6a7828c"
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
	