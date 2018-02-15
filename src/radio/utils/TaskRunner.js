export default class TaskRunner {
  taskQueue = [];
  isRunning = false;

  queueTask(task) {
    this.taskQueue.push(task);
    if (!this.isRunning) {
      console.log('Downloading...');
      this.doTask();
    }
  }

  doTask = () => {
    const task = this.taskQueue.shift();
    this.isRunning = !!task;
    if (task) {
      task(this.doTask);
    }
  };
}
