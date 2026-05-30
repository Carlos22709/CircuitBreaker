const STATES = {
  CLOSED: 'CLOSED',
  OPEN: 'OPEN',
  HALF_OPEN: 'HALF_OPEN'
};

class CircuitBreaker {
  constructor({ failureThreshold = 3, recoveryTimeoutMs = 30000 } = {}) {
    this.failureThreshold = failureThreshold;
    this.recoveryTimeoutMs = recoveryTimeoutMs;
    this.state = STATES.CLOSED;
    this.failureCount = 0;
    this.openedAt = null;
    this.lastTransition = null;
    this.transitionHistory = [];
  }

  getState() {
    if (this.state === STATES.OPEN && this.canMoveToHalfOpen()) {
      this.transitionTo(STATES.HALF_OPEN);
    }

    return this.state;
  }

  canMoveToHalfOpen() {
    return this.openedAt && Date.now() - this.openedAt >= this.recoveryTimeoutMs;
  }

  allowRequest() {
    return this.getState() !== STATES.OPEN;
  }

  recordSuccess() {
    if (this.state !== STATES.CLOSED) {
      this.transitionTo(STATES.CLOSED);
    }

    this.failureCount = 0;
    this.openedAt = null;
  }

  recordFailure() {
    this.failureCount += 1;

    if (this.state === STATES.HALF_OPEN || this.failureCount >= this.failureThreshold) {
      this.transitionTo(STATES.OPEN);
      this.openedAt = Date.now();
    }
  }

  transitionTo(nextState) {
    if (this.state === nextState) {
      return;
    }

    const transition = `${this.state}_TO_${nextState}`;
    this.state = nextState;
    this.lastTransition = transition;
    this.transitionHistory.push({
      transition,
      at: new Date().toISOString()
    });
    console.log(`Circuit Breaker: ${transition}`);
  }

  snapshot() {
    const currentState = this.getState();
    const retryInMs = currentState === STATES.OPEN
      ? Math.max(this.recoveryTimeoutMs - (Date.now() - this.openedAt), 0)
      : 0;

    return {
      state: currentState,
      failureCount: this.failureCount,
      failureThreshold: this.failureThreshold,
      recoveryTimeoutMs: this.recoveryTimeoutMs,
      retryInMs,
      lastTransition: this.lastTransition,
      transitionHistory: this.transitionHistory.slice(-10)
    };
  }
}

module.exports = {
  CircuitBreaker,
  STATES
};
