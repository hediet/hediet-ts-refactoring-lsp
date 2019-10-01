import * as ts_module from "typescript/lib/tsserverlibrary";

export class Logger {
	public static forPlugin(
		pluginId: string,
		info: ts_module.server.PluginCreateInfo
	) {
		return new Logger(pluginId, info.project.projectService.logger);
	}

	private constructor(
		public readonly pluginId: string,
		private readonly _logger: ts_module.server.Logger
	) {}

	public info(message: string) {
		this._logger.info(`[${this.pluginId}] ${JSON.stringify(message)}`);
	}
}
