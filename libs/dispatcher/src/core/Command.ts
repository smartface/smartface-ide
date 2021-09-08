export default abstract class Command<TResult = any> {
  abstract execute(opts?: any): Promise<TResult>;
}
