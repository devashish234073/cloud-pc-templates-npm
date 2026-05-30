function terminalSupportsColor(stream = process.stdout, env = process.env) {
  if (env.NO_COLOR || env.NODE_DISABLE_COLORS === '1') {
    return false;
  }

  if (env.FORCE_COLOR && env.FORCE_COLOR !== '0') {
    return true;
  }

  if (!stream || !stream.isTTY) {
    return false;
  }

  if (typeof stream.hasColors === 'function') {
    return stream.hasColors();
  }

  if (env.TERM === 'dumb') {
    return false;
  }

  return Boolean(env.COLORTERM) || /ansi|color|cygwin|linux|rxvt|screen|tmux|vt100|vt220|xterm/i.test(env.TERM || '');
}

const useColor = terminalSupportsColor();

function colorize(text, colorCode) {
  return useColor ? `\u001b[${colorCode}m${text}\u001b[0m` : text;
}

module.exports = {
  colorize
};
