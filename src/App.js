import React from "react";
import { withStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import Container from "@material-ui/core/Container";
import { Paper, Grid, TextField, Button } from "@material-ui/core";

const styles = {
  heroContent: {
    marginTop: "50px"
  },
  footer: {}
};

function deltaE(rgbA, rgbB) {
  let labA = rgb2lab(rgbA);
  let labB = rgb2lab(rgbB);
  let deltaL = labA[0] - labB[0];
  let deltaA = labA[1] - labB[1];
  let deltaB = labA[2] - labB[2];
  let c1 = Math.sqrt(labA[1] * labA[1] + labA[2] * labA[2]);
  let c2 = Math.sqrt(labB[1] * labB[1] + labB[2] * labB[2]);
  let deltaC = c1 - c2;
  let deltaH = deltaA * deltaA + deltaB * deltaB - deltaC * deltaC;
  deltaH = deltaH < 0 ? 0 : Math.sqrt(deltaH);
  let sc = 1.0 + 0.045 * c1;
  let sh = 1.0 + 0.015 * c1;
  let deltaLKlsl = deltaL / 1.0;
  let deltaCkcsc = deltaC / sc;
  let deltaHkhsh = deltaH / sh;
  let i =
    deltaLKlsl * deltaLKlsl + deltaCkcsc * deltaCkcsc + deltaHkhsh * deltaHkhsh;
  return i < 0 ? 0 : Math.sqrt(i);
}

function rgb2lab(rgb) {
  let r = rgb[0] / 255,
    g = rgb[1] / 255,
    b = rgb[2] / 255,
    x,
    y,
    z;
  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;
  x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.0;
  z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
  x = x > 0.008856 ? Math.pow(x, 1 / 3) : 7.787 * x + 16 / 116;
  y = y > 0.008856 ? Math.pow(y, 1 / 3) : 7.787 * y + 16 / 116;
  z = z > 0.008856 ? Math.pow(z, 1 / 3) : 7.787 * z + 16 / 116;
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}

function rcv() {
  return Math.floor(Math.random() * 256);
}

function computeDistance(colors) {
  let distance = 100;
  let colorIndices = [];
  for (let i = 0; i < colors.length; i++) {
    let color = colors[i];
    for (let j = 0; j < colors.length; j++) {
      if (j === i) {
        continue;
      }
      let delta = deltaE(color, colors[j]);
      if (delta < distance) {
        distance = delta;
        colorIndices = [];
        if (i + 1 !== colors.length) {
          colorIndices.push(i);
        }
        if (j + 1 !== colors.length) {
          colorIndices.push(j);
        }
      }
    }
  }
  return { distance, colorIndices };
}

function computeGradient(colors, i) {
  const epsilon = 0.00001;
  let g = [0, 0, 0];
  for (let c = 0; c < 3; c++) {
    let color1 = [colors[i][0], colors[i][1], colors[i][2]];
    let color2 = [colors[i][0], colors[i][1], colors[i][2]];
    if (color1[c] + epsilon >= 255) {
      color1[c] -= epsilon;
    } else {
      color2[c] += epsilon;
    }
    let d1 = 100;
    let d2 = 100;
    for (let j = 0; j < colors.length; j++) {
      if (j === i) {
        continue;
      }
      let delta1 = deltaE(color1, colors[j]);
      let delta2 = deltaE(color2, colors[j]);
      if (delta1 < d1) {
        d1 = delta1;
      }
      if (delta2 < d2) {
        d2 = delta2;
      }
    }
    g[c] += (d2 - d1) / epsilon;
  }
  return g;
}

function colorToString(color) {
  let r = Math.round(color[0]).toString(16);
  if (r.length < 2) {
    r = "0" + r;
  }
  let g = Math.round(color[1]).toString(16);
  if (g.length < 2) {
    g = "0" + g;
  }
  let b = Math.round(color[2]).toString(16);
  if (b.length < 2) {
    b = "0" + b;
  }
  return `#${r}${g}${b}`;
}

function findNColors(colorStrings, iterations, background) {
  let learningRate = 0.1;
  let n = colorStrings.length;
  let colors = [];
  for (let i = 0; i < n; i++) {
    colors.push([
      parseInt(colorStrings[i].slice(1, 3), 16),
      parseInt(colorStrings[i].slice(3, 5), 16),
      parseInt(colorStrings[i].slice(5, 7), 16)
    ]);
  }
  colors.push([
    parseInt(background.slice(1, 3), 16),
    parseInt(background.slice(3, 5), 16),
    parseInt(background.slice(5, 7), 16)
  ]);
  let finalDistance = 0;
  for (let i = 0; i < iterations; i++) {
    let { distance, colorIndices } = computeDistance(colors);
    finalDistance = distance;
    let colorIndex =
      colorIndices[Math.floor(Math.random() * colorIndices.length)];
    let gradient = computeGradient(colors, colorIndex);
    for (let c = 0; c < 3; c++) {
      colors[colorIndex][c] += learningRate * gradient[c];
      if (colors[colorIndex][c] < 0) {
        colors[colorIndex][c] = 0;
      }
      if (colors[colorIndex][c] > 255) {
        colors[colorIndex][c] = 255;
      }
    }
  }
  colors.pop();
  return {
    newColors: colors.map(colorToString),
    distance: finalDistance
  };
}

function randomColors(n) {
  let colors = [];
  for (let i = 0; i < n; i++) {
    colors.push(
      `#${rcv().toString(16)}${rcv().toString(16)}${rcv().toString(16)}`
    );
  }
  return colors;
}

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      colors: ["#ea1d13", "#000000", "#6e5dff"],
      backgroundColor: "#ffffff",
      computing: false,
      contrast: 0
    };
  }

  opposite = color => {
    let r = parseInt(color.slice(1, 3));
    let g = parseInt(color.slice(3, 5));
    let b = parseInt(color.slice(5, 7));
    if (r + g + b > 256 * 1.5) {
      return "#000000";
    } else {
      return "#ffffff";
    }
  };

  updateColors = () => {
    setTimeout(() => {
      console.log("start");
      const { newColors, distance } = findNColors(
        this.state.colors,
        10000,
        this.state.backgroundColor
      );
      this.setState({ colors: newColors, contrast: distance });
      if (this.state.computing) {
        this.updateColors();
      }
      console.log("done");
    }, 1);
  };

  render() {
    const { classes } = this.props;
    return (
      <div className={classes.heroContent}>
        <Container maxWidth="md">
          <Typography
            component="h1"
            variant="h2"
            align="center"
            color="textPrimary"
            gutterBottom
          >
            Contrastive Color Chooser
          </Typography>
          <Typography
            variant="h5"
            align="center"
            color="textSecondary"
            paragraph
          >
            Use this tool to select the most contrastive colors to human
            perception. Press start and an algorithm will begin running to
            slowly find more and more contrastive colors. The longer you let it
            run, the better the result may be. It is possible the algorithm will
            get stuck, in which case, you may want to hit the reset button.
          </Typography>
        </Container>
        <Grid container className={classes.root} spacing={2}>
          <Grid item xs={12}>
            <Grid container justify="center">
              <Grid item xs={6}>
                <Paper
                  style={{
                    backgroundColor: this.state.backgroundColor,
                    marginLeft: "20px",
                    marginRight: "20px",
                    padding: "20px"
                  }}
                >
                  <Typography
                    variant="h3"
                    align="center"
                    color="textPrimary"
                    gutterBottom
                  >
                    Computed Colors
                  </Typography>
                  {this.state.colors.map((color, index) => (
                    <div
                      key={index}
                      style={{
                        backgroundColor: color,
                        height: "50px",
                        marginBottom: "20px",
                        textAlign: "center",
                        color: this.opposite(color)
                      }}
                    >
                      {color}
                    </div>
                  ))}
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper
                  style={{
                    padding: "20px",
                    marginLeft: "20px",
                    marginRight: "20px"
                  }}
                >
                  <Typography
                    variant="h3"
                    align="center"
                    color="textPrimary"
                    gutterBottom
                  >
                    Configuration
                  </Typography>
                  <Grid container direction="column" spacing={2}>
                    <Grid
                      container
                      item
                      direction="row"
                      justify="space-between"
                    >
                      <Typography
                        variant="h5"
                        align="left"
                        color="textSecondary"
                      >
                        Select background color:
                      </Typography>
                      <input
                        type="color"
                        name="favcolor"
                        defaultValue="#F0F0F0"
                        onChange={event =>
                          this.setState({ backgroundColor: event.target.value })
                        }
                      />
                    </Grid>
                    <Grid
                      container
                      item
                      direction="row"
                      justify="space-between"
                    >
                      <Typography
                        variant="h5"
                        align="left"
                        color="textSecondary"
                      >
                        Number of colors:
                      </Typography>
                      <TextField
                        id="standard-basic"
                        type="number"
                        defaultValue={3}
                        style={{ width: "60px" }}
                        onChange={event => {
                          let numColors = parseInt(event.target.value);
                          if (numColors < 1) {
                            numColors = 1;
                            alert("Invalid number of colors");
                          }
                          this.setState({
                            colors: Array.apply(null, Array(numColors)).map(
                              () =>
                                `#${rcv().toString(16)}${rcv().toString(
                                  16
                                )}${rcv().toString(16)}`
                            )
                          });
                        }}
                      />
                    </Grid>
                    <Grid container item direction="row" justify="space-around">
                      <Button
                        color="secondary"
                        onClick={() => this.setState({ computing: false })}
                      >
                        Stop
                      </Button>
                      <Button
                        color="primary"
                        onClick={() => {
                          if (this.state.computing) {
                            this.setState({
                              colors: randomColors(this.state.colors.length)
                            });
                          } else {
                            this.setState({ computing: true });
                            this.updateColors();
                          }
                        }}
                      >
                        {!this.state.computing && "Start"}
                        {this.state.computing && "Reset"}
                      </Button>
                    </Grid>
                    {this.state.computing && (
                      <Grid
                        container
                        item
                        direction="row"
                        justify="space-around"
                      >
                        <Typography
                          variant="h5"
                          align="left"
                          color="textSecondary"
                        >
                          Contrast: {this.state.contrast}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </Paper>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </div>
    );
  }
}
export default withStyles(styles)(App);
