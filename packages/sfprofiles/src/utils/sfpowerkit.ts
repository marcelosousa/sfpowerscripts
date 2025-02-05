import { SfProject } from '@salesforce/core';
import { UX } from '@salesforce/command';
import chalk from 'chalk';
import * as fs from 'fs-extra';
import SQLITEKeyValue from './sqlitekv';
import FileUtils from './fileutils';
import SFPLogger, {LoggerLevel } from '@dxatscale/sfp-logger';
import NodeCache from 'node-cache';


export class Sfpowerkit {
    private static defaultFolder: string;
    private static projectDirectories: string[];
    private static pluginConfig;
    public static isJsonFormatEnabled: boolean;
    private static ux: UX;
    private static sourceApiVersion: any;
    private static cache;


    static enableColor() {
        chalk.level = 2;
    }

    static disableColor() {
        chalk.level = 0;
    }

    public static resetCache() {
        const cachePath = FileUtils.getLocalCachePath('sfpowerkit-cache.db');
        if (fs.existsSync(cachePath))
            fs.unlinkSync(cachePath);
    }

    public static initCache() {
        try {
            //Set the cache path on init,
            //TODO: Move this to a temporary directory with randomization
            Sfpowerkit.cache = new SQLITEKeyValue(FileUtils.getLocalCachePath('sfpowerkit-cache.db'));
            Sfpowerkit.cache.init();
        } catch (error) {
            //Fallback to NodeCache, as sqlite cache cant be lazily loaded
            //Retreive and Merge doesnt have workers so sqlite cant be loaded.. need further investigation
            Sfpowerkit.cache = new NodeCache();
        }
    }

    public static getFromCache(key: string): any {
        return Sfpowerkit.cache.get(key);
    }

    public static addToCache(key: string, value: any) {
        return Sfpowerkit.cache.set(key, value);
    }

    public static setLogLevel(logLevel: string, isJsonFormatEnabled: boolean) {
        this.isJsonFormatEnabled = isJsonFormatEnabled ? true : false;
    }

    public static setProjectDirectories(packagedirectories: string[]) {
        Sfpowerkit.projectDirectories = packagedirectories;
    }

    public static async getProjectDirectories() {
        if (!Sfpowerkit.projectDirectories) {
            Sfpowerkit.projectDirectories = [];
            const dxProject = await SfProject.resolve();
            const project = await dxProject.retrieveSfProjectJson();
            const packages = (project.getPackageDirectoriesSync()) || [];
            packages.forEach((element) => {
                Sfpowerkit.projectDirectories.push(element.path);
                if (element.default) {
                    Sfpowerkit.defaultFolder = element.path;
                }
            });
        }
        return Sfpowerkit.projectDirectories;
    }

    public static async getDefaultFolder() {
        if (!Sfpowerkit.defaultFolder) {
            await Sfpowerkit.getProjectDirectories();
        }
        return Sfpowerkit.defaultFolder;
    }
    public static setDefaultFolder(defaultFolder: string) {
        Sfpowerkit.defaultFolder = defaultFolder;
    }

    public static async getConfig() {
        if (!Sfpowerkit.pluginConfig) {
            const dxProject = await SfProject.resolve();
            const project = await dxProject.retrieveSfProjectJson();
            const plugins = project.get('plugins') || {};
            const sfpowerkitConfig = plugins['sfpowerkit'];
            Sfpowerkit.pluginConfig = sfpowerkitConfig || {};
        }
        return Sfpowerkit.pluginConfig;
    }
    public static setapiversion(apiversion: any) {
        Sfpowerkit.sourceApiVersion = apiversion;
    }

    public static async getApiVersion(): Promise<any> {
        if (!Sfpowerkit.sourceApiVersion) {
            const dxProject = await SfProject.resolve();
            const project = await dxProject.retrieveSfProjectJson();
            Sfpowerkit.sourceApiVersion = project.get('sourceApiVersion');
        }
        return Sfpowerkit.sourceApiVersion;
    }
    /**
     * Print log only if the log level for this commamnd matches the log level for the message
     * @param message Message to print
     * @param messageLoglevel Log level for the message
     */
    public static log(message: any, logLevel: LoggerLevel) {
        // TODO: Ensure usage of this logging mechanism is deprecated
        if (this.isJsonFormatEnabled) return;
        SFPLogger.log(message, logLevel);
    }
    public static setUx(ux: UX) {
        this.ux = ux;
    }

    public static setStatus(status: string) {
        this.ux.setSpinnerStatus(status);
    }
}
