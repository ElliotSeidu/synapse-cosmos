// Feedforward Neural Network Brain for Bio-Synanth Organisms
// Features live activation feedback, genetic mutation, crossover, and serialization.

export class NeuralBrain {
  constructor(inputSize = 8, hiddenSize = 8, outputSize = 4, weightsIH = null, weightsHO = null, biasH = null, biasO = null) {
    this.inputSize = inputSize;
    this.hiddenSize = hiddenSize;
    this.outputSize = outputSize;

    // Weights from Input to Hidden (hiddenSize x inputSize)
    this.wIH = weightsIH ? weightsIH.map(row => [...row]) : this.randomMatrix(hiddenSize, inputSize);
    // Weights from Hidden to Output (outputSize x hiddenSize)
    this.wHO = weightsHO ? weightsHO.map(row => [...row]) : this.randomMatrix(outputSize, hiddenSize);
    
    // Biases
    this.bH = biasH ? [...biasH] : this.randomVector(hiddenSize);
    this.bO = biasO ? [...biasO] : this.randomVector(outputSize);

    // Cached live activations for HUD telemetry visualization
    this.lastInputs = new Array(inputSize).fill(0);
    this.lastHidden = new Array(hiddenSize).fill(0);
    this.lastOutputs = new Array(outputSize).fill(0);
  }

  randomMatrix(rows, cols) {
    const mat = [];
    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) {
        row.push((Math.random() * 2 - 1) * 0.8);
      }
      mat.push(row);
    }
    return mat;
  }

  randomVector(size) {
    const vec = [];
    for (let i = 0; i < size; i++) {
      vec.push((Math.random() * 2 - 1) * 0.4);
    }
    return vec;
  }

  activate(x) {
    // Fast hyperbolic tangent approximation
    return Math.tanh(x);
  }

  forward(inputs) {
    this.lastInputs = [...inputs];

    // Compute Hidden Layer
    for (let h = 0; h < this.hiddenSize; h++) {
      let sum = this.bH[h];
      for (let i = 0; i < this.inputSize; i++) {
        sum += this.wIH[h][i] * inputs[i];
      }
      this.lastHidden[h] = this.activate(sum);
    }

    // Compute Output Layer
    for (let o = 0; o < this.outputSize; o++) {
      let sum = this.bO[o];
      for (let h = 0; h < this.hiddenSize; h++) {
        sum += this.wHO[o][h] * this.lastHidden[h];
      }
      this.lastOutputs[o] = this.activate(sum);
    }

    // Output Mapping:
    // 0: Steer angle (-1 = hard left, +1 = hard right)
    // 1: Throttle (0 to 1)
    // 2: Dash trigger (0 to 1)
    // 3: Pheromone secrete rate (0 to 1)
    return {
      steer: this.lastOutputs[0],
      throttle: (this.lastOutputs[1] + 1) * 0.5,
      dash: Math.max(0, this.lastOutputs[2]),
      secrete: (this.lastOutputs[3] + 1) * 0.5
    };
  }

  // Clone with genetic mutation
  mutate(mutationRate = 0.08, mutationMagnitude = 0.3) {
    const copy = new NeuralBrain(
      this.inputSize,
      this.hiddenSize,
      this.outputSize,
      this.wIH,
      this.wHO,
      this.bH,
      this.bO
    );

    // Mutate wIH
    for (let r = 0; r < this.hiddenSize; r++) {
      for (let c = 0; c < this.inputSize; c++) {
        if (Math.random() < mutationRate) {
          copy.wIH[r][c] += (Math.random() * 2 - 1) * mutationMagnitude;
        }
      }
      if (Math.random() < mutationRate) {
        copy.bH[r] += (Math.random() * 2 - 1) * mutationMagnitude;
      }
    }

    // Mutate wHO
    for (let r = 0; r < this.outputSize; r++) {
      for (let c = 0; c < this.hiddenSize; c++) {
        if (Math.random() < mutationRate) {
          copy.wHO[r][c] += (Math.random() * 2 - 1) * mutationMagnitude;
        }
      }
      if (Math.random() < mutationRate) {
        copy.bO[r] += (Math.random() * 2 - 1) * mutationMagnitude;
      }
    }

    return copy;
  }

  // Sexual reproduction crossover between two parent brains
  static crossover(brainA, brainB) {
    const child = new NeuralBrain(brainA.inputSize, brainA.hiddenSize, brainA.outputSize);

    for (let r = 0; r < brainA.hiddenSize; r++) {
      for (let c = 0; c < brainA.inputSize; c++) {
        child.wIH[r][c] = Math.random() < 0.5 ? brainA.wIH[r][c] : brainB.wIH[r][c];
      }
      child.bH[r] = Math.random() < 0.5 ? brainA.bH[r] : brainB.bH[r];
    }

    for (let r = 0; r < brainA.outputSize; r++) {
      for (let c = 0; c < brainA.hiddenSize; c++) {
        child.wHO[r][c] = Math.random() < 0.5 ? brainA.wHO[r][c] : brainB.wHO[r][c];
      }
      child.bO[r] = Math.random() < 0.5 ? brainA.bO[r] : brainB.bO[r];
    }

    return child;
  }

  serialize() {
    return {
      inputSize: this.inputSize,
      hiddenSize: this.hiddenSize,
      outputSize: this.outputSize,
      wIH: this.wIH,
      wHO: this.wHO,
      bH: this.bH,
      bO: this.bO
    };
  }

  static deserialize(data) {
    return new NeuralBrain(
      data.inputSize,
      data.hiddenSize,
      data.outputSize,
      data.wIH,
      data.wHO,
      data.bH,
      data.bO
    );
  }
}
